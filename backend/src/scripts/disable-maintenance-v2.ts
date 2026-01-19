
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('🔌 Turning OFF Maintenance Mode (Correct Method)...');

        // 1. Fetch existing config
        const existing = await prisma.cmsSettings.findUnique({
            where: { key: 'site_config' }
        });

        let config = {};
        if (existing && existing.value) {
            config = existing.value as any;
        }

        // 2. Force False
        config['maintenanceMode'] = false;

        // 3. Save Back
        await prisma.cmsSettings.upsert({
            where: { key: 'site_config' },
            create: { key: 'site_config', value: config },
            update: { value: config }
        });

        console.log('✅ Maintenance Mode Disabled in site_config.');
        console.log('Current Config:', config);

    } catch (error) {
        console.error('❌ Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
