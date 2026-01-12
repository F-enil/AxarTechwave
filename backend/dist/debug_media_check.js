"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('--- Debugging Recent Products Media ---');
    const products = await prisma.product.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: { variants: true }
    });
    for (const p of products) {
        console.log(`\nProduct ID: ${p.id} | Title: ${p.title} | Slug: ${p.slug}`);
        const media = await prisma.media.findMany({
            where: {
                ownerType: 'product',
                ownerId: p.id
            }
        });
        console.log(`   Media Count: ${media.length}`);
        media.forEach((m, i) => {
            console.log(`   [${i + 1}] Kind: ${m.kind}, Key: ${m.s3Key}`);
        });
    }
}
main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
//# sourceMappingURL=debug_media_check.js.map