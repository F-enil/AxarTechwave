
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('🗑️ Starting Database Reset (Preserving Admin)...');

        // 1. Delete Dependencies First (Child Tables)
        await prisma.auditLog.deleteMany({});
        await prisma.invoice.deleteMany({});
        await prisma.shipment.deleteMany({});
        await prisma.payment.deleteMany({});

        // Returns & Refunds
        await prisma.refund.deleteMany({});
        await prisma.pickup.deleteMany({});
        await prisma.returnRequest.deleteMany({});

        await prisma.orderItem.deleteMany({});
        await prisma.order.deleteMany({});

        await prisma.cartItem.deleteMany({});
        // await prisma.cart.deleteMany({}); // Cart is one-to-one with User, can stay or cascade? Cascade usually.
        // Actually Carts are optional on User. Let's delete them.
        await prisma.cart.deleteMany({});

        await prisma.wishlistItem.deleteMany({});
        await prisma.wishlist.deleteMany({});

        await prisma.review.deleteMany({});

        // Products & Inventory
        await prisma.inventoryLedger.deleteMany({});
        await prisma.price.deleteMany({});
        await prisma.cartItem.deleteMany({}); // Doune check
        await prisma.productVariant.deleteMany({});
        // Cloudinary Wipe
        try {
            // Fetch all media keys first
            const allMedia = await prisma.media.findMany({ select: { s3Key: true } });
            if (allMedia.length > 0) {
                console.log(`☁️ Deleting ${allMedia.length} assets from Cloudinary...`);
                const cloudinary = require('cloudinary').v2;
                cloudinary.config({
                    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                    api_key: process.env.CLOUDINARY_API_KEY,
                    api_secret: process.env.CLOUDINARY_API_SECRET
                });

                // Delete in chunks of 100 (API limit)
                const chunkSize = 100;
                for (let i = 0; i < allMedia.length; i += chunkSize) {
                    const chunk = allMedia.slice(i, i + chunkSize).map(m => m.s3Key);
                    // s3Key in DB should be the public_id
                    if (chunk.length > 0) {
                        await cloudinary.api.delete_resources(chunk, { resource_type: 'image' });
                        await cloudinary.api.delete_resources(chunk, { resource_type: 'video' }); // Just in case
                    }
                }
                console.log('☁️ Cloudinary assets deleted.');
            }
        } catch (e) {
            console.error('Cloudinary delete failed (Check credentials)', e.message);
        }

        await prisma.media.deleteMany({});
        await prisma.product.deleteMany({});
        await prisma.category.deleteMany({}); // Self-relation might need raw query or careful order.
        // Prisma handles self-relation deletion if we do it right, but CASCADE is better.
        // Let's delete children categories first? No, deleteMany doesn't guarantee order.
        // If CASCADE is set in DB, it's fine. If not, we might hit errors.
        // For Category, we might need a recursive delete or just raw SQL.
        // Let's try simple deleteMany, if it fails, we use raw.
        try {
            await prisma.category.deleteMany({});
        } catch (e) {
            console.log('Category delete failed (constraint), attempting raw');
            // Postgres specific
            await prisma.$executeRawUnsafe(`TRUNCATE TABLE categories RESTART IDENTITY CASCADE;`);
        }

        await prisma.newsletterSubscriber.deleteMany({});
        await prisma.contactMessage.deleteMany({});
        await prisma.coupon.deleteMany({});

        // 2. Users & Addresses
        await prisma.address.deleteMany({});

        // KEEP ADMIN
        const deletedUsers = await prisma.user.deleteMany({
            where: {
                role: {
                    notIn: ['admin', 'staff']
                }
            }
        });

        console.log(`✅ Deleted ${deletedUsers.count} non-admin users.`);
        console.log('✅ Database Reset Complete!');

    } catch (error) {
        console.error('❌ Reset Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
