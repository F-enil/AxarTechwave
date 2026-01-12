import { PrismaService } from '../prisma/prisma.service';
export declare class StatsController {
    private prisma;
    constructor(prisma: PrismaService);
    getDashboardStats(): Promise<{
        totalUsers: number;
        totalOrders: number;
        totalProducts: number;
        totalRevenue: number;
        recentOrders: ({
            user: {
                id: number;
                createdAt: Date;
                updatedAt: Date;
                gstNumber: string | null;
                email: string;
                username: string | null;
                passwordHash: string;
                emailVerified: boolean;
                role: string;
                twofaSecret: string | null;
                provider: string;
                providerId: string | null;
            };
        } & {
            id: number;
            userId: number | null;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            currency: string;
            customId: string | null;
            total: import("@prisma/client/runtime/library").Decimal;
            discount: import("@prisma/client/runtime/library").Decimal;
            shippingAddress: import("@prisma/client/runtime/library").JsonValue | null;
            taxDetails: import("@prisma/client/runtime/library").JsonValue | null;
            gstNumber: string | null;
            trackingId: string | null;
            courierCompanyName: string | null;
        })[];
        topProducts: {
            id: number;
            title: string;
            variantId: number;
            sold: number;
        }[];
        analytics: {
            salesByCity: Record<string, number>;
            salesByState: Record<string, number>;
            salesByCountry: Record<string, number>;
        };
    }>;
    private getTopSellingProducts;
}
