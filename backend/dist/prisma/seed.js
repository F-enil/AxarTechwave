"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const argon2 = require("argon2");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding database...');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@axartechwave.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminHash = await argon2.hash(adminPassword);
    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            passwordHash: adminHash,
        },
        create: {
            email: adminEmail,
            passwordHash: adminHash,
            username: 'Super Admin',
            role: 'admin',
        },
    });
    console.log({ admin });
    const categories = [
        { name: 'Smartphones', slug: 'smartphones' },
        { name: 'Accessories', slug: 'accessories' },
        { name: 'Gadgets', slug: 'gadgets' },
        { name: 'Cases', slug: 'cases' },
    ];
    for (const cat of categories) {
        await prisma.category.upsert({
            where: { slug: cat.slug },
            update: {},
            create: cat,
        });
    }
    const smartphoneCat = await prisma.category.findUnique({ where: { slug: 'smartphones' } });
    if (smartphoneCat) {
        const product1 = await prisma.product.upsert({
            where: { slug: 'iphone-15-pro' },
            update: {},
            create: {
                title: 'iPhone 15 Pro',
                slug: 'iphone-15-pro',
                description: 'The ultimate iPhone.',
                categoryId: smartphoneCat.id,
                status: 'active',
                variants: {
                    create: {
                        sku: 'IP15P-128-BLK',
                        attributes: { color: 'Black Titanium', storage: '128GB' },
                        inventory: {
                            create: {
                                quantity: 10,
                                type: 'in',
                                location: 'default'
                            }
                        },
                        prices: {
                            create: {
                                currency: 'INR',
                                basePrice: 134900,
                                compareAtPrice: 129900,
                            }
                        }
                    }
                }
            },
        });
        console.log({ product1 });
    }
    const accessoriesCat = await prisma.category.findUnique({ where: { slug: 'accessories' } });
    if (accessoriesCat) {
        const product2 = await prisma.product.upsert({
            where: { slug: 'airpods-pro-2' },
            update: {},
            create: {
                title: 'AirPods Pro 2',
                slug: 'airpods-pro-2',
                description: 'Magic like you’ve never heard.',
                categoryId: accessoriesCat.id,
                status: 'active',
                variants: {
                    create: {
                        sku: 'APP2',
                        attributes: { color: 'White' },
                        inventory: {
                            create: {
                                quantity: 50,
                                type: 'in',
                                location: 'default'
                            }
                        },
                        prices: {
                            create: {
                                currency: 'INR',
                                basePrice: 24900,
                                compareAtPrice: 22900,
                            }
                        }
                    }
                }
            }
        });
        console.log({ product2 });
    }
    console.log('Seeding finished.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map