"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const prisma_service_1 = require("../prisma/prisma.service");
let StatsController = class StatsController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboardStats() {
        const [totalUsers, totalOrders, totalProducts, recentOrders, ordersWithAddress] = await Promise.all([
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
        const salesByCity = {};
        const salesByState = {};
        const salesByCountry = {};
        ordersWithAddress.forEach(order => {
            if (order.shippingAddress) {
                const addr = order.shippingAddress;
                if (addr.city)
                    salesByCity[addr.city] = (salesByCity[addr.city] || 0) + 1;
                if (addr.state)
                    salesByState[addr.state] = (salesByState[addr.state] || 0) + 1;
                if (addr.country)
                    salesByCountry[addr.country] = (salesByCountry[addr.country] || 0) + 1;
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
    async getTopSellingProducts() {
        const topItems = await this.prisma.orderItem.groupBy({
            by: ['variantId'],
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 5
        });
        const enriched = await Promise.all(topItems.map(async (item) => {
            var _a, _b;
            const variant = await this.prisma.productVariant.findUnique({
                where: { id: item.variantId },
                include: { product: true }
            });
            return {
                id: (_a = variant === null || variant === void 0 ? void 0 : variant.product) === null || _a === void 0 ? void 0 : _a.id,
                title: ((_b = variant === null || variant === void 0 ? void 0 : variant.product) === null || _b === void 0 ? void 0 : _b.title) || 'Unknown Product',
                variantId: item.variantId,
                sold: item._sum.quantity
            };
        }));
        return enriched;
    }
};
exports.StatsController = StatsController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StatsController.prototype, "getDashboardStats", null);
exports.StatsController = StatsController = __decorate([
    (0, common_1.Controller)('stats'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'staff'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StatsController);
//# sourceMappingURL=stats.controller.js.map