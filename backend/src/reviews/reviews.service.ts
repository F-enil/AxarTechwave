import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
    constructor(private prisma: PrismaService) { }

    async create(userId: number, productId: number, rating: number, comment?: string) {
        if (rating < 1 || rating > 5) {
            throw new BadRequestException('Rating must be between 1 and 5');
        }

        // Verify product exists
        const product = await this.prisma.product.findUnique({ where: { id: productId } });
        if (!product) throw new BadRequestException('Product not found');

        const review = await (this.prisma as any).review.create({
            data: {
                userId,
                productId,
                rating,
                comment,
                status: 'published' // Auto-publish for MVP
            },
            include: { user: { select: { username: true } } }
        });
        return review;
    }

    async findByProduct(productId: number) {
        const reviews = await (this.prisma as any).review.findMany({
            where: { productId, status: 'published' },
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { username: true } } }
        });

        const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1);

        return {
            reviews,
            averageRating: Number(avgRating.toFixed(1)),
            totalReviews: reviews.length
        };
    }
}
