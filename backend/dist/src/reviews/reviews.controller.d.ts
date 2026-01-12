import { ReviewsService } from './reviews.service';
export declare class ReviewsController {
    private readonly reviewsService;
    constructor(reviewsService: ReviewsService);
    create(req: any, body: {
        productId: number;
        rating: number;
        comment?: string;
    }): Promise<any>;
    findByProduct(productId: string): Promise<{
        reviews: any;
        averageRating: number;
        totalReviews: any;
    }>;
}
