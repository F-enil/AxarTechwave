import { CartService } from './cart.service';
export declare class CartController {
    private readonly cartService;
    constructor(cartService: CartService);
    getCart(req: any): Promise<any>;
    updateItem(req: any, id: string, body: {
        quantity: number;
    }): Promise<{
        id: number;
        variantId: number;
        quantity: number;
        cartId: number;
    }>;
    addToCart(req: any, body: {
        variantId: number;
        quantity: number;
    }): Promise<{
        id: number;
        variantId: number;
        quantity: number;
        cartId: number;
    }>;
    removeItem(req: any, id: string): Promise<{
        id: number;
        variantId: number;
        quantity: number;
        cartId: number;
    }>;
    applyCoupon(req: any, body: {
        code: string;
    }): Promise<{
        id: number;
        userId: number | null;
        createdAt: Date;
        updatedAt: Date;
        discount: import("@prisma/client/runtime/library").Decimal | null;
        couponCode: string | null;
    }>;
}
