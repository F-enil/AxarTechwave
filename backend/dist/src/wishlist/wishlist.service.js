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
exports.WishlistService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const media_service_1 = require("../media/media.service");
let WishlistService = class WishlistService {
    constructor(prisma, mediaService) {
        this.prisma = prisma;
        this.mediaService = mediaService;
    }
    async getWishlist(userId) {
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
        if (!wishlist)
            return [];
        const productIds = wishlist.items.map(i => i.variant.product.id);
        const medias = await this.prisma.media.findMany({
            where: {
                ownerType: 'product',
                ownerId: { in: productIds },
                kind: 'image'
            }
        });
        return Promise.all(wishlist.items.map(async (item) => {
            var _a;
            const pId = item.variant.product.id;
            const productMedia = medias.filter(m => m.ownerId === pId).sort((a, b) => a.sortOrder - b.sortOrder);
            let image = '';
            if (productMedia.length > 0) {
                image = await this.mediaService.getPresignedUrl(productMedia[0].s3Key);
            }
            return {
                id: pId,
                title: item.variant.product.title,
                price: ((_a = item.variant.prices[0]) === null || _a === void 0 ? void 0 : _a.basePrice) || 0,
                image,
                variantId: item.variant.id,
                addedAt: item.createdAt
            };
        }));
    }
    async toggleItem(userId, productId) {
        let wishlist = await this.prisma.wishlist.findUnique({ where: { userId } });
        if (!wishlist) {
            wishlist = await this.prisma.wishlist.create({ data: { userId } });
        }
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
            include: { variants: true }
        });
        if (!product || product.variants.length === 0)
            throw new common_1.BadRequestException('Product not found or has no variants');
        const variantId = product.variants[0].id;
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
        }
        else {
            await this.prisma.wishlistItem.create({
                data: {
                    wishlistId: wishlist.id,
                    variantId
                }
            });
            return { status: 'added' };
        }
    }
};
exports.WishlistService = WishlistService;
exports.WishlistService = WishlistService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        media_service_1.MediaService])
], WishlistService);
//# sourceMappingURL=wishlist.service.js.map