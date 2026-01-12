import { Body, Controller, Get, Post, UseGuards, Request, Delete, Param } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
    constructor(private readonly wishlistService: WishlistService) { }

    @Get()
    async getWishlist(@Request() req) {
        return this.wishlistService.getWishlist(req.user.userId);
    }

    @Post('toggle')
    async toggleItem(@Request() req, @Body() body: { productId: string | number }) {
        const pId = typeof body.productId === 'string' ? parseInt(body.productId, 10) : body.productId;
        return this.wishlistService.toggleItem(req.user.userId, pId);
    }
}
