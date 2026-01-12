import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { MediaService } from '../media/media.service';

@Injectable()
export class CartService {
    constructor(
        private prisma: PrismaService,
        private mediaService: MediaService
    ) { }

    async getCart(userId: number) {
        let cart: any = await this.prisma.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        variant: {
                            include: {
                                product: true, // removed invalid include: { media: true }
                                prices: true,
                            }
                        }
                    }
                }
            }
        });

        if (!cart) {
            await this.prisma.cart.create({
                data: { userId },
            });
            // Refetch to match the include structure
            cart = await this.prisma.cart.findUnique({
                where: { userId },
                include: {
                    items: {
                        include: {
                            variant: {
                                include: {
                                    product: true,
                                    prices: true,
                                }
                            }
                        }
                    }
                }
            });
        }

        // Process media URLs for each item manually
        if (cart && cart.items && cart.items.length > 0) {
            const productIds = cart.items.map(item => item.variant.productId);

            // 1. Fetch Media
            const mediaItems = await this.prisma.media.findMany({
                where: {
                    ownerType: 'product',
                    ownerId: { in: productIds }
                }
            });

            // 2. Generate URLs
            const mediaWithUrls = await Promise.all(mediaItems.map(async (m) => ({
                ...m,
                url: await this.mediaService.getPresignedUrl(m.s3Key)
            })));

            // 3. Attach to products
            for (const item of cart.items) {
                if (item.variant?.product) {
                    item.variant.product.media = mediaWithUrls.filter(m => m.ownerId === item.variant.productId);
                }
            }
        }

        return cart;
    }

    async addToCart(userId: number, variantId: number, quantity: number) {
        const cart = await this.getCart(userId);
        const existingItem = await this.prisma.cartItem.findFirst({
            where: { cartId: cart.id, variantId },
        });

        if (existingItem) {
            return this.prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: existingItem.quantity + quantity },
            });
        } else {
            return this.prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    variantId,
                    quantity,
                },
            });
        }
    }

    async removeItem(userId: number, itemId: number) {
        return this.prisma.cartItem.delete({
            where: { id: itemId },
        });
    }

    async updateItem(userId: number, itemId: number, quantity: number) {
        // Optional: Verify permission via cart ownership if strict
        return this.prisma.cartItem.update({
            where: { id: itemId },
            data: { quantity }
        });
    }

    async applyCoupon(userId: number, code: string) {
        const coupon = await (this.prisma as any).coupon.findUnique({
            where: { code }
        });

        if (!coupon || !coupon.isActive) {
            throw new NotFoundException('Invalid or inactive coupon');
        }

        if (coupon.expiry && new Date() > coupon.expiry) {
            throw new NotFoundException('Coupon expired');
        }

        const cart = await this.getCart(userId);
        let cartTotal = 0;

        // Calculate total simplified (assuming INR and first price)
        cart.items.forEach(item => {
            const price = Number(item.variant.prices[0]?.basePrice) || 0;
            cartTotal += price * item.quantity;
        });

        let discountAmount = 0;
        if (coupon.type === 'fixed') {
            discountAmount = coupon.value;
        } else if (coupon.type === 'percent') {
            discountAmount = (cartTotal * coupon.value) / 100;
        }

        // Cap discount at total
        if (discountAmount > cartTotal) discountAmount = cartTotal;

        return this.prisma.cart.update({
            where: { id: cart.id },
            data: {
                // @ts-ignore
                couponCode: code,
                discount: discountAmount
            }
        });
    }
}
