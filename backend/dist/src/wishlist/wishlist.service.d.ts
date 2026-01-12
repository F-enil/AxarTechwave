import { PrismaService } from '../prisma/prisma.service';
import { MediaService } from '../media/media.service';
export declare class WishlistService {
    private prisma;
    private mediaService;
    constructor(prisma: PrismaService, mediaService: MediaService);
    getWishlist(userId: number): Promise<{
        id: number;
        title: string;
        price: number | import("@prisma/client/runtime/library").Decimal;
        image: string;
        variantId: number;
        addedAt: Date;
    }[]>;
    toggleItem(userId: number, productId: number): Promise<{
        status: string;
    }>;
}
