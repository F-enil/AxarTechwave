
const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function reset() {
    const email = 'admin@axartechwave.com';
    const password = 'admin123';

    console.log(`Resetting password for ${email}...`);

    try {
        const hash = await argon2.hash(password);

        // Try to update existing user
        try {
            const user = await prisma.user.update({
                where: { email },
                data: { passwordHash: hash }
            });
            console.log('Success! Password reset to:', password);
        } catch (e) {
            // If user not found (P2025), create it
            if (e.code === 'P2025') {
                console.log('User not found, creating...');
                await prisma.user.create({
                    data: {
                        email,
                        passwordHash: hash,
                        username: 'Super Admin',
                        role: 'admin'
                    }
                });
                console.log('Admin user created with password:', password);
            } else {
                throw e;
            }
        }
    } catch (e) {
        console.error('Error resetting password:', e);
    } finally {
        await prisma.$disconnect();
    }
}

reset();
