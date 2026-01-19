import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CmsService {
    constructor(private prisma: PrismaService) { }

    async getSettings() {
        // Defaults
        const defaults = {
            title: 'Axar TechWave',
            logo: 'logo.png', // Default local asset
            social: {
                facebook: 'https://facebook.com',
                instagram: 'https://instagram.com',
                whatsapp: 'https://wa.me/'
            },
            contact: {
                phone: '+91 12345 67890',
                email: 'support@axartechwave.com',
                address: 'Surat, Gujarat'
            },
            maintenanceMode: false
        };

        const settings = await this.prisma.cmsSettings.findMany();
        const config = { ...defaults };

        settings.forEach(s => {
            // Merge DB settings
            if (s.key === 'site_config') {
                // Deep merge logic simplified for MVP
                const dbValue = s.value as any;
                Object.assign(config, dbValue);
            }
        });

        return config;
    }

    async updateSettings(data: any) {
        return this.prisma.cmsSettings.upsert({
            where: { key: 'site_config' },
            create: { key: 'site_config', value: data },
            update: { value: data }
        });
    }

    async resetDatabase() {
        console.log('⚠️ TRIGGERING FULL DB RESET FROM CMS SERVICE ⚠️');

        // 1. Cloudinary Wipe
        try {
            const allMedia = await this.prisma.media.findMany({ select: { s3Key: true } });
            if (allMedia.length > 0) {
                const cloudinary = require('cloudinary').v2;
                cloudinary.config({
                    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                    api_key: process.env.CLOUDINARY_API_KEY,
                    api_secret: process.env.CLOUDINARY_API_SECRET
                });

                const chunkSize = 100;
                for (let i = 0; i < allMedia.length; i += chunkSize) {
                    const chunk = allMedia.slice(i, i + chunkSize).map(m => m.s3Key);
                    if (chunk.length > 0) {
                        try {
                            await cloudinary.api.delete_resources(chunk, { resource_type: 'image' });
                            await cloudinary.api.delete_resources(chunk, { resource_type: 'video' });
                        } catch (e) { console.error('Cloudinary chunk delete failed', e); }
                    }
                }
            }
        } catch (e) {
            console.error('Cloudinary config/delete failed', e);
        }

        // 2. Database Wipe
        // Dependencies
        await this.prisma.auditLog.deleteMany({});
        await this.prisma.invoice.deleteMany({});
        await this.prisma.shipment.deleteMany({});
        await this.prisma.payment.deleteMany({});
        await this.prisma.refund.deleteMany({});
        await this.prisma.pickup.deleteMany({});
        await this.prisma.returnRequest.deleteMany({});
        await this.prisma.orderItem.deleteMany({});
        await this.prisma.order.deleteMany({});
        await this.prisma.cartItem.deleteMany({});
        await this.prisma.cart.deleteMany({});
        await this.prisma.wishlistItem.deleteMany({});
        await this.prisma.wishlist.deleteMany({});
        await this.prisma.review.deleteMany({});

        // Catalog
        await this.prisma.inventoryLedger.deleteMany({});
        await this.prisma.price.deleteMany({});
        await this.prisma.productVariant.deleteMany({});
        await this.prisma.media.deleteMany({});
        await this.prisma.product.deleteMany({});

        try {
            await this.prisma.category.deleteMany({});
        } catch (e) {
            await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE categories RESTART IDENTITY CASCADE;`);
        }

        await this.prisma.newsletterSubscriber.deleteMany({});
        await this.prisma.contactMessage.deleteMany({});
        await this.prisma.coupon.deleteMany({});

        // Users
        await this.prisma.address.deleteMany({});
        await this.prisma.user.deleteMany({
            where: { role: { notIn: ['admin', 'staff'] } }
        });

        return { success: true, message: 'Factory Reset Complete' };
    }
}
