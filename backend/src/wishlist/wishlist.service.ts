import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MediaService } from '../media/media.service';

@Injectable()
export class WishlistService {
    constructor(
        private prisma: PrismaService,
        private mediaService: MediaService
    ) { }

    async getWishlist(userId: number) {
        const wishlist = await this.prisma.wishlist.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        variant: {
                            include: {
                                prices: true,
                                product: true
                            }
                        }
                    }
                }
            }
        });

        if (!wishlist) return [];

        const productIds = wishlist.items.map(i => i.variant.product.id);
        const medias = await this.prisma.media.findMany({
            where: {
                ownerType: 'product',
                ownerId: { in: productIds },
                kind: 'image'
            }
        });

        // Flatten structure for frontend convenience
        return Promise.all(wishlist.items.map(async item => {
            const pId = item.variant.product.id;
            const productMedia = medias.filter(m => m.ownerId === pId).sort((a, b) => a.sortOrder - b.sortOrder);

            let image = '';
            if (productMedia.length > 0) {
                // Generate valid URL using MediaService (handles presigning/public access)
                image = await this.mediaService.getPresignedUrl(productMedia[0].s3Key);
            }

            return {
                id: pId,
                title: item.variant.product.title,
                price: item.variant.prices[0]?.basePrice || 0,
                image,
                variantId: item.variant.id,
                addedAt: item.createdAt
            };
        }));
    }

    async toggleItem(userId: number, productId: number) {
        // Ensure wishlist exists
        let wishlist = await this.prisma.wishlist.findUnique({ where: { userId } });
        if (!wishlist) {
            wishlist = await this.prisma.wishlist.create({ data: { userId } });
        }

        // Resolve variant (MVP: first variant)
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
            include: { variants: true }
        });
        if (!product || product.variants.length === 0) throw new BadRequestException('Product not found or has no variants');
        const variantId = product.variants[0].id;

        // Check if exists
        const existing = await this.prisma.wishlistItem.findUnique({
            where: {
                wishlistId_variantId: {
                    wishlistId: wishlist.id,
                    variantId
                }
            }
        });

        if (existing) {
            await this.prisma.wishlistItem.delete({ where: { id: existing.id } });
            return { status: 'removed' };
        } else {
            await this.prisma.wishlistItem.create({
                data: {
                    wishlistId: wishlist.id,
                    variantId
                }
            });
            return { status: 'added' };
        }
    }
}
