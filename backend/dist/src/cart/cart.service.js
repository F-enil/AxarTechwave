"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const media_service_1 = require("../media/media.service");
let CartService = class CartService {
    constructor(prisma, mediaService) {
        this.prisma = prisma;
        this.mediaService = mediaService;
    }
    async getCart(userId) {
        var _a;
        let cart = await this.prisma.cart.findUnique({
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
        if (!cart) {
            await this.prisma.cart.create({
                data: { userId },
            });
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
        if (cart && cart.items && cart.items.length > 0) {
            const productIds = cart.items.map(item => item.variant.productId);
            const mediaItems = await this.prisma.media.findMany({
                where: {
                    ownerType: 'product',
                    ownerId: { in: productIds }
                }
            });
            const mediaWithUrls = await Promise.all(mediaItems.map(async (m) => (Object.assign(Object.assign({}, m), { url: await this.mediaService.getPresignedUrl(m.s3Key) }))));
            for (const item of cart.items) {
                if ((_a = item.variant) === null || _a === void 0 ? void 0 : _a.product) {
                    item.variant.product.media = mediaWithUrls.filter(m => m.ownerId === item.variant.productId);
                }
            }
        }
        return cart;
    }
    async addToCart(userId, variantId, quantity) {
        const cart = await this.getCart(userId);
        const existingItem = await this.prisma.cartItem.findFirst({
            where: { cartId: cart.id, variantId },
        });
        if (existingItem) {
            return this.prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: existingItem.quantity + quantity },
            });
        }
        else {
            return this.prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    variantId,
                    quantity,
                },
            });
        }
    }
    async removeItem(userId, itemId) {
        return this.prisma.cartItem.delete({
            where: { id: itemId },
        });
    }
    async updateItem(userId, itemId, quantity) {
        return this.prisma.cartItem.update({
            where: { id: itemId },
            data: { quantity }
        });
    }
    async applyCoupon(userId, code) {
        const coupon = await this.prisma.coupon.findUnique({
            where: { code }
        });
        if (!coupon || !coupon.isActive) {
            throw new common_1.NotFoundException('Invalid or inactive coupon');
        }
        if (coupon.expiry && new Date() > coupon.expiry) {
            throw new common_1.NotFoundException('Coupon expired');
        }
        const cart = await this.getCart(userId);
        let cartTotal = 0;
        cart.items.forEach(item => {
            var _a;
            const price = Number((_a = item.variant.prices[0]) === null || _a === void 0 ? void 0 : _a.basePrice) || 0;
            cartTotal += price * item.quantity;
        });
        let discountAmount = 0;
        if (coupon.type === 'fixed') {
            discountAmount = coupon.value;
        }
        else if (coupon.type === 'percent') {
            discountAmount = (cartTotal * coupon.value) / 100;
        }
        if (discountAmount > cartTotal)
            discountAmount = cartTotal;
        return this.prisma.cart.update({
            where: { id: cart.id },
            data: {
                couponCode: code,
                discount: discountAmount
            }
        });
    }
};
exports.CartService = CartService;
exports.CartService = CartService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        media_service_1.MediaService])
], CartService);
//# sourceMappingURL=cart.service.js.map