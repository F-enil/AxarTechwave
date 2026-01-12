
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const product = await prisma.product.findFirst({
            where: { title: 'iphone15' },
            include: {
                variants: {
                    include: {
                        inventory: true
                    }
                }
            }
        });

        if (!product) {
            console.log('Product iphone15 not found');
            return;
        }

        console.log('Product Status:', product.status);

        for (const v of product.variants) {
            console.log('Variant Status:', v.status);
            console.log('Inventory Records:', JSON.stringify(v.inventory));

            const totalIn = v.inventory.filter(i => i.type === 'in').reduce((acc, i) => acc + i.quantity, 0);
            const totalOut = v.inventory.filter(i => i.type === 'out').reduce((acc, i) => acc + i.quantity, 0);
            console.log(`Type IN: ${totalIn}, Type OUT: ${totalOut}`);
            console.log(`Calculated Stock: ${totalIn - totalOut}`);
        }
    } catch (e) { console.error(e); }
    finally { await prisma.$disconnect(); }
}

main();
