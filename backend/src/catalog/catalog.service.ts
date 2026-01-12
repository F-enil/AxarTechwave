import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { MediaService } from '../media/media.service';

@Injectable()
export class CatalogService {
    constructor(
        private prisma: PrismaService,
        private mediaService: MediaService
    ) { }

    async getCategories() {
        return this.prisma.category.findMany({
            include: { children: true },
            where: { parentId: null },
        });
    }

    async getProducts(params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.ProductWhereUniqueInput;
        where?: Prisma.ProductWhereInput;
        orderBy?: Prisma.ProductOrderByWithRelationInput;
    }) {
        const { skip, take, cursor, where, orderBy } = params;
        const products = await this.prisma.product.findMany({
            skip,
            take,
            cursor,
            where: { ...where, status: 'active' },
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

        // Manual Media Attach (Polymorphic)
        const productIds = products.map(p => p.id);
        const mediaItems = await this.prisma.media.findMany({
            where: {
                ownerType: 'product',
                ownerId: { in: productIds }
            }
        });

        // Generate URLs
        const mediaWithUrls = await Promise.all(mediaItems.map(async (m) => ({
            ...m,
            url: await this.mediaService.getPresignedUrl(m.s3Key)
        })));

        return products.map(p => ({
            ...p,
            media: mediaWithUrls.filter(m => m.ownerId === p.id),
            variants: p.variants.map(v => {
                const totalIn = v.inventory?.filter((i: any) => i.type === 'in').reduce((sum: number, i: any) => sum + i.quantity, 0) || 0;
                const totalOut = v.inventory?.filter((i: any) => i.type === 'out').reduce((sum: number, i: any) => sum + i.quantity, 0) || 0;
                const stock = totalIn - totalOut;
                // Remove raw inventory to keep payload clean
                const { inventory, ...variantData } = v;
                return { ...variantData, stock };
            })
        }));
    }

    async getProduct(slug: string) {
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
        if (!product) throw new NotFoundException('Product not found');

        const media = await this.prisma.media.findMany({
            where: {
                ownerType: 'product',
                ownerId: product.id
            }
        });

        // Generate URLs
        const mediaWithUrls = await Promise.all(media.map(async (m) => ({
            ...m,
            url: await this.mediaService.getPresignedUrl(m.s3Key)
        })));

        // Calculate Stock for Variants
        const variantsWithStock = product.variants.map(v => {
            const totalIn = v.inventory?.filter((i: any) => i.type === 'in').reduce((sum: number, i: any) => sum + i.quantity, 0) || 0;
            const totalOut = v.inventory?.filter((i: any) => i.type === 'out').reduce((sum: number, i: any) => sum + i.quantity, 0) || 0;
            const stock = totalIn - totalOut;
            const { inventory, ...variantData } = v;
            return { ...variantData, stock };
        });

        return { ...product, variants: variantsWithStock, media: mediaWithUrls };
    }

    async createProduct(data: any) {
        const { variants, categoryId, media, productMedia, ...productData } = data;

        const productDataClean = { ...productData };
        if (categoryId) {
            productDataClean.category = { connect: { id: Number(categoryId) } };
        }

        // Create Product & Media in one try block
        let product;
        try {
            product = await this.prisma.product.create({
                data: {
                    ...productDataClean,
                    slug: productDataClean.slug || `product-${Date.now()}`,
                    variants: {
                        create: variants.map((v: any) => ({
                            sku: v.sku,
                            prices: {
                                create: v.prices.map((p: any) => ({
                                    currency: p.currency,
                                    basePrice: p.basePrice,
                                    compareAtPrice: p.salePrice
                                }))
                            },
                            // Stock handled via inventory ledger
                            inventory: {
                                create: {
                                    type: 'in',
                                    quantity: v.stock || 0,
                                    location: 'default',
                                    reference: 'initial_stock'
                                }
                            }
                        }))
                    }
                }
            });

            // Handle Media
            if (media && Array.isArray(media) && media.length > 0) {
                await Promise.all(media.map(m =>
                    this.prisma.media.create({
                        data: {
                            ownerType: 'product',
                            ownerId: product.id,
                            kind: m.kind || 'image',
                            s3Key: m.s3Key,
                            alt: m.alt || productDataClean.title
                        }
                    })
                ));
            }

            return product;

        } catch (error) {
            console.error('[CreateProduct] Error:', error);
            const fs = require('fs');
            // Hardcoded accessible path
            const logPath = 'C:\\Users\\asus\\.gemini\\antigravity\\brain\\cd799105-74ef-4555-989e-46125b097f23\\create_error_log.txt';
            fs.appendFileSync(logPath, `[${new Date().toISOString()}] Error creating product: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}\n Payload: ${JSON.stringify(data)}\n`);

            if (error.code === 'P2002') {
                throw new Error('A product with this Slug already exists.');
            }
            throw new Error(`Internal Server Error: ${error.message}`);
        }
    }

    async updateProduct(id: number, data: any) {
        // Fallback: If 'media' is stripped, look for 'productMedia'
        if (!data.media && data.productMedia) {
            console.log(`[UpdateProduct] Recovered media from productMedia override. Count: ${data.productMedia.length}`);
            data.media = data.productMedia;
        }

        const { variants, categoryId, media, productMedia, ...productData } = data;
        const updateData: any = { ...productData };

        if (categoryId) {
            updateData.category = { connect: { id: Number(categoryId) } };
        }

        try {
            // 1. Update Product Details
            await this.prisma.product.update({
                where: { id },
                data: updateData
            });

            // 2. Handle Media (Full Replace Strategy)
            if (media && Array.isArray(media)) {
                // Delete existing media
                await this.prisma.media.deleteMany({
                    where: { ownerType: 'product', ownerId: id }
                });

                // Create new media
                if (media.length > 0) {
                    await Promise.all(media.map(m =>
                        this.prisma.media.create({
                            data: {
                                ownerType: 'product',
                                ownerId: id,
                                kind: m.kind || 'image',
                                s3Key: m.s3Key,
                                alt: productData.title
                            }
                        })
                    ));
                }
            }

            // 3. Update Variant/Stock (Simplified for Main Variant)
            const product = await this.prisma.product.findUnique({
                where: { id },
                include: { variants: { include: { prices: true } } }
            });

            if (product && product.variants.length > 0) {
                const variant = product.variants[0];
                if (variants && variants.length > 0) {
                    const vData = variants[0];
                    const priceData = vData.prices && vData.prices.length > 0 ? vData.prices[0] : null;

                    // Update Price
                    if (priceData && variant.prices.length > 0) {
                        await this.prisma.price.update({
                            where: { id: variant.prices[0].id },
                            data: { basePrice: priceData.basePrice, compareAtPrice: priceData.salePrice }
                        });
                    }

                    // Update Stock (Create Inventory Ledger Entry)
                    if (vData.stock !== undefined) {
                        const totalIn = await this.prisma.inventoryLedger.aggregate({
                            where: { variantId: variant.id, type: 'in' },
                            _sum: { quantity: true }
                        }).then(res => res._sum?.quantity || 0);

                        const totalOut = await this.prisma.inventoryLedger.aggregate({
                            where: { variantId: variant.id, type: 'out' },
                            _sum: { quantity: true }
                        }).then(res => res._sum?.quantity || 0);

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
        } catch (error) {
            console.error('Update Product Error Details:', JSON.stringify(error, null, 2));
            console.error('Stack:', error.stack);
            throw error;
        }
    }

    async deleteProduct(id: number) {
        try {
            console.log(`[DeleteProduct] Attempting to archive product ID: ${id}`);
            const result = await this.prisma.product.update({
                where: { id },
                data: { status: 'archived' }
            });
            console.log(`[DeleteProduct] Success. ID: ${id}`);
            return result;
        } catch (error) {
            console.error(`[DeleteProduct] Error: ${error.message}`, error);
            const fs = require('fs');
            // Use a hardcoded accessible path for debugging
            const logPath = 'C:\\Users\\asus\\.gemini\\antigravity\\brain\\cd799105-74ef-4555-989e-46125b097f23\\delete_error_log.txt';
            fs.appendFileSync(logPath, `[${new Date().toISOString()}] Error deleting ${id}: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}\n`);
            throw error;
        }
    }
}
