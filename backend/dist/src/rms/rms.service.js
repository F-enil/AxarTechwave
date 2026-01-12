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
exports.RmsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let RmsService = class RmsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createReturnRequest(userId, data) {
        const order = await this.prisma.order.findFirst({
            where: { id: data.orderId, userId }
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        const existing = await this.prisma.returnRequest.findFirst({
            where: { orderId: data.orderId, variantId: data.variantId }
        });
        if (existing)
            throw new common_1.BadRequestException('Return request already exists for this item');
        return this.prisma.returnRequest.create({
            data: {
                userId,
                orderId: data.orderId,
                variantId: data.variantId,
                reason: data.reason,
                type: data.type,
                images: data.images || [],
                status: 'requested',
            }
        });
    }
    async getUserReturns(userId) {
        return this.prisma.returnRequest.findMany({
            where: { userId },
            include: { variant: { include: { product: true } }, order: true, pickup: true, refund: true },
            orderBy: { createdAt: 'desc' }
        });
    }
    async getAllReturns() {
        return this.prisma.returnRequest.findMany({
            include: { user: true, variant: { include: { product: true } }, order: true, pickup: true, refund: true },
            orderBy: { createdAt: 'desc' }
        });
    }
    async updateStatus(id, status, note) {
        return this.prisma.returnRequest.update({
            where: { id },
            data: { status, adminNote: note }
        });
    }
    async schedulePickup(id, data) {
        const returnReq = await this.prisma.returnRequest.findUnique({ where: { id } });
        if (!returnReq)
            throw new common_1.NotFoundException('Return request not found');
        const pickup = await this.prisma.pickup.upsert({
            where: { returnRequestId: id },
            update: {
                courierName: data.courierName,
                trackingNumber: data.trackingNumber,
                pickupDate: new Date(data.pickupDate),
                status: 'scheduled'
            },
            create: {
                returnRequestId: id,
                courierName: data.courierName,
                trackingNumber: data.trackingNumber,
                pickupDate: new Date(data.pickupDate),
                status: 'scheduled'
            }
        });
        await this.prisma.returnRequest.update({
            where: { id },
            data: { status: 'pickup_scheduled' }
        });
        return pickup;
    }
    async processRefund(id, data) {
        const returnReq = await this.prisma.returnRequest.findUnique({ where: { id } });
        if (!returnReq)
            throw new common_1.NotFoundException('Return request not found');
        const refund = await this.prisma.refund.create({
            data: {
                returnRequestId: id,
                amount: data.amount,
                method: data.method,
                transactionId: data.transactionId,
                status: 'processed',
                processedAt: new Date()
            }
        });
        await this.prisma.returnRequest.update({
            where: { id },
            data: { status: 'refunded' }
        });
        return refund;
    }
};
exports.RmsService = RmsService;
exports.RmsService = RmsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RmsService);
//# sourceMappingURL=rms.service.js.map