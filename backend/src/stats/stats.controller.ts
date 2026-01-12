import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('stats')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'staff')
export class StatsController {
    constructor(private prisma: PrismaService) { }

    @Get('dashboard')
    async getDashboardStats() {
        const [
            totalUsers,
            totalOrders,
            totalProducts,
            recentOrders,
            ordersWithAddress
        ] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.order.count(),
            this.prisma.product.count(),
            this.prisma.order.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { user: true }
            }),
            this.prisma.order.findMany({
                select: { shippingAddress: true },
                where: { status: { not: 'cancelled' } }
            })
        ]);

        const revenueResult = await this.prisma.order.aggregate({
            _sum: { total: true },
            where: { status: { not: 'cancelled' } }
        });

        // Geographic Analytics
        const salesByCity: Record<string, number> = {};
        const salesByState: Record<string, number> = {};
        const salesByCountry: Record<string, number> = {};

        ordersWithAddress.forEach(order => {
            if (order.shippingAddress) {
                const addr = order.shippingAddress as any; // Cast JSON
                if (addr.city) salesByCity[addr.city] = (salesByCity[addr.city] || 0) + 1;
                if (addr.state) salesByState[addr.state] = (salesByState[addr.state] || 0) + 1;
                if (addr.country) salesByCountry[addr.country] = (salesByCountry[addr.country] || 0) + 1;
            }
        });

        return {
            totalUsers,
            totalOrders,
            totalProducts,
            totalRevenue: Number(revenueResult._sum.total) || 0,
            recentOrders,
            topProducts: await this.getTopSellingProducts(),
            analytics: {
                salesByCity,
                salesByState,
                salesByCountry
            }
        };
    }

    private async getTopSellingProducts() {
        const topItems = await this.prisma.orderItem.groupBy({
            by: ['variantId'],
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 5
        });

        // Enrich with product details
        const enriched = await Promise.all(topItems.map(async (item) => {
            const variant = await this.prisma.productVariant.findUnique({
                where: { id: item.variantId },
                include: { product: true }
            });
            return {
                id: variant?.product?.id,
                title: variant?.product?.title || 'Unknown Product',
                variantId: item.variantId,
                sold: item._sum.quantity
            };
        }));

        return enriched;
    }
}
