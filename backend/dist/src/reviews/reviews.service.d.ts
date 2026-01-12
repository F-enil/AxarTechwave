import { PrismaService } from '../prisma/prisma.service';
export declare class ReviewsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: number, productId: number, rating: number, comment?: string): Promise<any>;
    findByProduct(productId: number): Promise<{
        reviews: any;
        averageRating: number;
        totalReviews: any;
    }>;
}
