const { PrismaClient } = require('@prisma/client');

// Use current env (which points to Prod Supabase as observed earlier)
const prisma = new PrismaClient();

async function check() {
    console.log('Connecting to database...');
    try {
        const settings = await prisma.cmsSettings.findMany();
        console.log('Success! Found settings:', settings);

        if (settings.length === 0) {
            console.log('Table exists but is empty.');
        }
    } catch (e) {
        console.error('FAILED to query cmsSettings:');
        console.error(e.message);
    } finally {
        await prisma.$disconnect();
    }
}

check();
