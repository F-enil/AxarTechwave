import { Controller, Get, Post, Delete, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CartService } from './cart.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('cart')
@UseGuards(AuthGuard('jwt'))
export class CartController {
    constructor(private readonly cartService: CartService) { }

    @Get()
    getCart(@Request() req) {
        return this.cartService.getCart(req.user.userId);
    }

    @Patch('items/:id')
    updateItem(@Request() req, @Param('id') id: string, @Body() body: { quantity: number }) {
        return this.cartService.updateItem(req.user.userId, Number(id), body.quantity);
    }

    @Post('items')
    addToCart(@Request() req, @Body() body: { variantId: number; quantity: number }) {
        return this.cartService.addToCart(req.user.userId, body.variantId, body.quantity);
    }

    @Delete('items/:id')
    removeItem(@Request() req, @Param('id') id: string) {
        return this.cartService.removeItem(req.user.userId, Number(id));
    }

    @Post('coupon')
    applyCoupon(@Request() req, @Body() body: { code: string }) {
        return this.cartService.applyCoupon(req.user.userId, body.code);
    }
}
