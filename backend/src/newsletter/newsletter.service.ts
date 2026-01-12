import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NewsletterService {
    constructor(private prisma: PrismaService) { }

    async subscribe(email: string) {
        try {
            const subscriber = await (this.prisma as any).newsletterSubscriber.create({
                data: { email },
            });
            return { message: 'Subscribed successfully', subscriber };
        } catch (error) {
            if (error.code === 'P2002') {
                throw new ConflictException('Email already subscribed');
            }
            throw error;
        }
    }
    async findAll() {
        return (this.prisma as any).newsletterSubscriber.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }
}
