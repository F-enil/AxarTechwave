"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ReviewsService = class ReviewsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, productId, rating, comment) {
        if (rating < 1 || rating > 5) {
            throw new common_1.BadRequestException('Rating must be between 1 and 5');
        }
        const product = await this.prisma.product.findUnique({ where: { id: productId } });
        if (!product)
            throw new common_1.BadRequestException('Product not found');
        const review = await this.prisma.review.create({
            data: {
                userId,
                productId,
                rating,
                comment,
                status: 'published'
            },
            include: { user: { select: { username: true } } }
        });
        return review;
    }
    async findByProduct(productId) {
        const reviews = await this.prisma.review.findMany({
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
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map