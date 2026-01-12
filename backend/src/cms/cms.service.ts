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
}
