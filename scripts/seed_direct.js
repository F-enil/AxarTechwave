const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- DIAGNOSING DATABASE (SIMPLE) ---');
    try {
        await prisma.$connect();
        console.log('✅ Connected to Database');

        // 1. Check if User table exists by counting
        try {
            const count = await prisma.user.count();
            console.log(`✅ Users Table exists. Count: ${count}`);
        } catch (e) {
            console.error('❌ Users Table MISSING. Error Code:', e.code);
            console.log('Please run: npx prisma db push');
            return;
        }

        // 2. Ensure Admin User
        const adminEmail = 'admin@axartechwave.com';
        // Using a dummy hash. Backend login will fail if it strictly checks Argon2, 
        // BUT this proves the user exists in DB. 
        // To log in, if backend uses argon2.verify, this fake hash will fail verification.
        // Howerver, this step is to prove DB readiness.
        const fakeHash = '$argon2id$v=19$m=65536,t=3,p=4$fakehashshouldbereplaced';

        const admin = await prisma.user.upsert({
            where: { email: adminEmail },
            update: { role: 'admin' }, // Don't overwrite password if exists
            create: {
                email: adminEmail,
                passwordHash: fakeHash,
                username: 'Super Admin',
                role: 'admin',
            },
        });
        console.log(`✅ Admin User Secured: ${admin.email} (ID: ${admin.id})`);

    } catch (err) {
        console.error('!!! DATABASE DIAGNOSIS FAILED !!!');
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
