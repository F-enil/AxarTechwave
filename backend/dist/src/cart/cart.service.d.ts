import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { MediaService } from '../media/media.service';
export declare class CartService {
    private prisma;
    private mediaService;
    constructor(prisma: PrismaService, mediaService: MediaService);
    getCart(userId: number): Promise<any>;
    addToCart(userId: number, variantId: number, quantity: number): Promise<{
        id: number;
        variantId: number;
        quantity: number;
        cartId: number;
    }>;
    removeItem(userId: number, itemId: number): Promise<{
        id: number;
        variantId: number;
        quantity: number;
        cartId: number;
    }>;
    updateItem(userId: number, itemId: number, quantity: number): Promise<{
        id: number;
        variantId: number;
        quantity: number;
        cartId: number;
    }>;
    applyCoupon(userId: number, code: string): Promise<{
        id: number;
        userId: number | null;
        createdAt: Date;
        updatedAt: Date;
        discount: Prisma.Decimal | null;
        couponCode: string | null;
    }>;
}
