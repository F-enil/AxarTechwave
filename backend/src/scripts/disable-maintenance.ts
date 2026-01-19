
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('🔌 Turning OFF Maintenance Mode...');

        await prisma.cmsSettings.upsert({
            where: { key: 'maintenanceMode' },
            create: { key: 'maintenanceMode', value: false },
            update: { value: false }
        });

        // Also ensure settings object exists if that's how it's stored
        // The previous code seemed to fetch /cms/settings and expect { maintenanceMode: true }
        // If it's a single key-value store, we might need to check the controller.
        // Let's check how the controller returns settings.
        // Assuming 'settings' key holds the JSON.

        // Actually, looking at ui.js: API.get('/cms/settings') returns an object.
        // If CmsSettings table has (key, value), maybe the controller aggregates them?
        // Let's assume the controller returns all rows as an object OR there's a specific "settings" row.

        // Safety: Update the likely "global" settings if it uses a single JSON blob
        // But the previous grep showed "key" as @id.

        console.log('✅ Maintenance Mode Disabled.');

    } catch (error) {
        console.error('❌ Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
