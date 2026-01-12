
import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    try {
        console.log('Connecting to database...');
        const count = await prisma.order.count();
        console.log(`Total Orders: ${count}`);

        if (count > 0) {
            const lastOrder = await prisma.order.findFirst({
                orderBy: { id: 'desc' },
                include: { shipments: true } // just in case
            });
            console.log('Last Order Data:');
            console.log(JSON.stringify(lastOrder, null, 2));
        } else {
            console.log('No orders found.');
        }
    } catch (e) {
        console.error('Error querying database:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
