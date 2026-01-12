import { WishlistService } from './wishlist.service';
export declare class WishlistController {
    private readonly wishlistService;
    constructor(wishlistService: WishlistService);
    getWishlist(req: any): Promise<{
        id: number;
        title: string;
        price: number | import("@prisma/client/runtime/library").Decimal;
        image: string;
        variantId: number;
        addedAt: Date;
    }[]>;
    toggleItem(req: any, body: {
        productId: string | number;
    }): Promise<{
        status: string;
    }>;
}
