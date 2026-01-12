const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Verifying ContactMessage model...');
    try {
        // 1. Create a test message
        const newMessage = await prisma.contactMessage.create({
            data: {
                firstName: 'Test',
                lastName: 'Verifier',
                email: 'test@verifier.com',
                subject: 'System Check',
                message: 'Verifying DB connectivity',
                status: 'new'
            }
        });
        console.log('✅ Created message:', newMessage.id);

        // 2. Fetch all messages
        const messages = await prisma.contactMessage.findMany();
        console.log('✅ Fetched messages count:', messages.length);

        // 3. Cleanup
        await prisma.contactMessage.delete({ where: { id: newMessage.id } });
        console.log('✅ Cleanup successful');

    } catch (e) {
        console.error('❌ Verification Failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
