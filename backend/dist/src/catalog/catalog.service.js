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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const media_service_1 = require("../media/media.service");
let CatalogService = class CatalogService {
    constructor(prisma, mediaService) {
        this.prisma = prisma;
        this.mediaService = mediaService;
    }
    async getCategories() {
        return this.prisma.category.findMany({
            include: { children: true },
            where: { parentId: null },
        });
    }
    async getProducts(params) {
        const { skip, take, cursor, where, orderBy } = params;
        const products = await this.prisma.product.findMany({
            skip,
            take,
            cursor,
            where: Object.assign(Object.assign({}, where), { status: 'active' }),
            orderBy,
            include: {
                variants: {
                    include: {
                        prices: true,
                        inventory: true
                    }
                },
                category: true,
            },
        });
        const productIds = products.map(p => p.id);
        const mediaItems = await this.prisma.media.findMany({
            where: {
                ownerType: 'product',
                ownerId: { in: productIds }
            }
        });
        const mediaWithUrls = await Promise.all(mediaItems.map(async (m) => (Object.assign(Object.assign({}, m), { url: await this.mediaService.getPresignedUrl(m.s3Key) }))));
        return products.map(p => (Object.assign(Object.assign({}, p), { media: mediaWithUrls.filter(m => m.ownerId === p.id), variants: p.variants.map(v => {
                var _a, _b;
                const totalIn = ((_a = v.inventory) === null || _a === void 0 ? void 0 : _a.filter((i) => i.type === 'in').reduce((sum, i) => sum + i.quantity, 0)) || 0;
                const totalOut = ((_b = v.inventory) === null || _b === void 0 ? void 0 : _b.filter((i) => i.type === 'out').reduce((sum, i) => sum + i.quantity, 0)) || 0;
                const stock = totalIn - totalOut;
                const { inventory } = v, variantData = __rest(v, ["inventory"]);
                return Object.assign(Object.assign({}, variantData), { stock });
            }) })));
    }
    async getProduct(slug) {
        const product = await this.prisma.product.findUnique({
            where: { slug },
            include: {
                variants: {
                    include: {
                        prices: true,
                        inventory: true,
                    }
                },
                category: true,
            },
        });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        const media = await this.prisma.media.findMany({
            where: {
                ownerType: 'product',
                ownerId: product.id
            }
        });
        const mediaWithUrls = await Promise.all(media.map(async (m) => (Object.assign(Object.assign({}, m), { url: await this.mediaService.getPresignedUrl(m.s3Key) }))));
        const variantsWithStock = product.variants.map(v => {
            var _a, _b;
            const totalIn = ((_a = v.inventory) === null || _a === void 0 ? void 0 : _a.filter((i) => i.type === 'in').reduce((sum, i) => sum + i.quantity, 0)) || 0;
            const totalOut = ((_b = v.inventory) === null || _b === void 0 ? void 0 : _b.filter((i) => i.type === 'out').reduce((sum, i) => sum + i.quantity, 0)) || 0;
            const stock = totalIn - totalOut;
            const { inventory } = v, variantData = __rest(v, ["inventory"]);
            return Object.assign(Object.assign({}, variantData), { stock });
        });
        return Object.assign(Object.assign({}, product), { variants: variantsWithStock, media: mediaWithUrls });
    }
    async createProduct(data) {
        const { variants, categoryId, media, productMedia } = data, productData = __rest(data, ["variants", "categoryId", "media", "productMedia"]);
        const productDataClean = Object.assign({}, productData);
        if (categoryId) {
            productDataClean.category = { connect: { id: Number(categoryId) } };
        }
        let product;
        try {
            product = await this.prisma.product.create({
                data: Object.assign(Object.assign({}, productDataClean), { slug: productDataClean.slug || `product-${Date.now()}`, variants: {
                        create: variants.map((v) => ({
                            sku: v.sku,
                            prices: {
                                create: v.prices.map((p) => ({
                                    currency: p.currency,
                                    basePrice: p.basePrice,
                                    compareAtPrice: p.salePrice
                                }))
                            },
                            inventory: {
                                create: {
                                    type: 'in',
                                    quantity: v.stock || 0,
                                    location: 'default',
                                    reference: 'initial_stock'
                                }
                            }
                        }))
                    } })
            });
            if (media && Array.isArray(media) && media.length > 0) {
                await Promise.all(media.map(m => this.prisma.media.create({
                    data: {
                        ownerType: 'product',
                        ownerId: product.id,
                        kind: m.kind || 'image',
                        s3Key: m.s3Key,
                        alt: m.alt || productDataClean.title
                    }
                })));
            }
            return product;
        }
        catch (error) {
            console.error('[CreateProduct] Error:', error);
            const fs = require('fs');
            const logPath = 'C:\\Users\\asus\\.gemini\\antigravity\\brain\\cd799105-74ef-4555-989e-46125b097f23\\create_error_log.txt';
            fs.appendFileSync(logPath, `[${new Date().toISOString()}] Error creating product: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}\n Payload: ${JSON.stringify(data)}\n`);
            if (error.code === 'P2002') {
                throw new Error('A product with this Slug already exists.');
            }
            throw new Error(`Internal Server Error: ${error.message}`);
        }
    }
    async updateProduct(id, data) {
        if (!data.media && data.productMedia) {
            console.log(`[UpdateProduct] Recovered media from productMedia override. Count: ${data.productMedia.length}`);
            data.media = data.productMedia;
        }
        const { variants, categoryId, media, productMedia } = data, productData = __rest(data, ["variants", "categoryId", "media", "productMedia"]);
        const updateData = Object.assign({}, productData);
        if (categoryId) {
            updateData.category = { connect: { id: Number(categoryId) } };
        }
        try {
            await this.prisma.product.update({
                where: { id },
                data: updateData
            });
            if (media && Array.isArray(media)) {
                await this.prisma.media.deleteMany({
                    where: { ownerType: 'product', ownerId: id }
                });
                if (media.length > 0) {
                    await Promise.all(media.map(m => this.prisma.media.create({
                        data: {
                            ownerType: 'product',
                            ownerId: id,
                            kind: m.kind || 'image',
                            s3Key: m.s3Key,
                            alt: productData.title
                        }
                    })));
                }
            }
            const product = await this.prisma.product.findUnique({
                where: { id },
                include: { variants: { include: { prices: true } } }
            });
            if (product && product.variants.length > 0) {
                const variant = product.variants[0];
                if (variants && variants.length > 0) {
                    const vData = variants[0];
                    const priceData = vData.prices && vData.prices.length > 0 ? vData.prices[0] : null;
                    if (priceData && variant.prices.length > 0) {
                        await this.prisma.price.update({
                            where: { id: variant.prices[0].id },
                            data: { basePrice: priceData.basePrice, compareAtPrice: priceData.salePrice }
                        });
                    }
                    if (vData.stock !== undefined) {
                        const totalIn = await this.prisma.inventoryLedger.aggregate({
                            where: { variantId: variant.id, type: 'in' },
                            _sum: { quantity: true }
                        }).then(res => { var _a; return ((_a = res._sum) === null || _a === void 0 ? void 0 : _a.quantity) || 0; });
                        const totalOut = await this.prisma.inventoryLedger.aggregate({
                            where: { variantId: variant.id, type: 'out' },
                            _sum: { quantity: true }
                        }).then(res => { var _a; return ((_a = res._sum) === null || _a === void 0 ? void 0 : _a.quantity) || 0; });
                        const currentStock = totalIn - totalOut;
                        const diff = Number(vData.stock) - currentStock;
                        if (diff !== 0) {
                            await this.prisma.inventoryLedger.create({
                                data: {
                                    variantId: variant.id,
                                    quantity: Math.abs(diff),
                                    type: diff > 0 ? 'in' : 'out',
                                    reference: 'admin_update'
                                }
                            });
                        }
                    }
                }
            }
            return { success: true };
        }
        catch (error) {
            console.error('Update Product Error Details:', JSON.stringify(error, null, 2));
            console.error('Stack:', error.stack);
            throw error;
        }
    }
    async deleteProduct(id) {
        try {
            console.log(`[DeleteProduct] Attempting to archive product ID: ${id}`);
            const result = await this.prisma.product.update({
                where: { id },
                data: { status: 'archived' }
            });
            console.log(`[DeleteProduct] Success. ID: ${id}`);
            return result;
        }
        catch (error) {
            console.error(`[DeleteProduct] Error: ${error.message}`, error);
            const fs = require('fs');
            const logPath = 'C:\\Users\\asus\\.gemini\\antigravity\\brain\\cd799105-74ef-4555-989e-46125b097f23\\delete_error_log.txt';
            fs.appendFileSync(logPath, `[${new Date().toISOString()}] Error deleting ${id}: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}\n`);
            throw error;
        }
    }
};
exports.CatalogService = CatalogService;
exports.CatalogService = CatalogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        media_service_1.MediaService])
], CatalogService);
//# sourceMappingURL=catalog.service.js.map