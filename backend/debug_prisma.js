const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    const keys = Object.keys(prisma);
    const hasWishlist = 'wishlist' in prisma || 'Wishlist' in prisma;
    const hasReview = 'review' in prisma || 'Review' in prisma;

    const output = `Keys: ${keys.join(', ')}\nHas Wishlist: ${hasWishlist}\nHas Review: ${hasReview}`;
    console.log(output);
    fs.writeFileSync('debug_output.txt', output);

    await prisma.$disconnect();
}

main().catch(err => {
    console.error(err);
    fs.writeFileSync('debug_output.txt', 'Error: ' + err.message);
});
