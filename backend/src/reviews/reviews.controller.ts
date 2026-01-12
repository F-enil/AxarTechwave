import { Body, Controller, Get, Param, Post, UseGuards, Request } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reviews')
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    async create(@Request() req, @Body() body: { productId: number; rating: number; comment?: string }) {
        return this.reviewsService.create(req.user.userId, body.productId, body.rating, body.comment);
    }

    @Get('product/:productId')
    async findByProduct(@Param('productId') productId: string) {
        return this.reviewsService.findByProduct(Number(productId));
    }
}
