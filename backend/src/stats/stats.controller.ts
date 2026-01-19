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
        try {
            const [
                totalUsers,
                totalOrders,
                totalProducts,
                recentOrders,
                ordersWithAddress
            ] = await Promise.all([
                // Count Users who have at least one NON-CREATED order (Paying Customers)
                this.prisma.user.count({
                    where: { orders: { some: { status: { not: 'created' } } } }
                }).catch(e => { console.error('Count users failed', e); return 0; }),

                // Count Orders that are NOT 'created' (Real Orders)
                this.prisma.order.count({
                    where: { status: { not: 'created' } }
                }).catch(e => { console.error('Count orders failed', e); return 0; }),

                this.prisma.product.count().catch(e => { console.error('Count products failed', e); return 0; }),
                this.prisma.order.findMany({
                    take: 5,
                    where: { status: { not: 'created' } }, // Filter Recent Orders too
                    orderBy: { createdAt: 'desc' },
                    include: { user: true }
                }).catch(e => { console.error('Find recent orders failed', e); return []; }),
                this.prisma.order.findMany({
                    select: { shippingAddress: true },
                    where: { status: { notIn: ['cancelled', 'created'] } } // Filter Map Data
                }).catch(e => { console.error('Orders address failed', e); return []; })
            ]);

            let totalRevenue = 0;
            try {
                const revenueResult = await this.prisma.order.aggregate({
                    _sum: { total: true },
                    // Only count actual sales (Paid/Packed/Shipped/Delivered/Returned? maybe not returned)
                    where: {
                        status: { in: ['paid', 'packed', 'shipped', 'delivered'] }
                    }
                });
                if (revenueResult._sum.total) {
                    totalRevenue = Number(revenueResult._sum.total);
                }
            } catch (e) {
                console.error('Revenue aggregate failed', e);
            }

            // Geographic Analytics
            const salesByCity: Record<string, number> = {};
            const salesByState: Record<string, number> = {};
            const salesByCountry: Record<string, number> = {};

            ordersWithAddress.forEach(order => {
                if (order.shippingAddress) {
                    try {
                        const addr = typeof order.shippingAddress === 'string'
                            ? JSON.parse(order.shippingAddress)
                            : order.shippingAddress as any;

                        if (addr?.city) salesByCity[addr.city] = (salesByCity[addr.city] || 0) + 1;
                        if (addr?.state) salesByState[addr.state] = (salesByState[addr.state] || 0) + 1;
                        if (addr?.country) salesByCountry[addr.country] = (salesByCountry[addr.country] || 0) + 1;
                    } catch (e) {
                        // Ignore malformed addresses
                    }
                }
            });

            const topProducts = await this.getTopSellingProducts().catch(e => {
                console.error('Get top products failed', e);
                return [];
            });

            return {
                totalUsers,
                totalOrders,
                totalProducts,
                totalRevenue,
                recentOrders,
                topProducts,
                analytics: {
                    salesByCity,
                    salesByState,
                    salesByCountry
                }
            };
        } catch (error) {
            console.error('Dashboard Stats Fatal Error:', error);
            // Return empty structure to prevent UI crash
            return {
                totalUsers: 0,
                totalOrders: 0,
                totalProducts: 0,
                totalRevenue: 0,
                recentOrders: [],
                topProducts: [],
                analytics: { salesByCity: {}, salesByState: {}, salesByCountry: {} }
            };
        }
    }

    private async getTopSellingProducts() {
        try {
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

            return enriched.filter(item => item.id !== undefined); // Filter out dead links
        } catch (e) {
            console.error('getTopSellingProducts internal error', e);
            return [];
        }
    }
}
