import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RmsService {
    constructor(private prisma: PrismaService) { }

    async createReturnRequest(userId: number, data: any) {
        // Validate Order ownership
        const order = await this.prisma.order.findFirst({
            where: { id: data.orderId, userId }
        });
        if (!order) throw new NotFoundException('Order not found');

        // Check if return already exists for this item
        const existing = await this.prisma.returnRequest.findFirst({
            where: { orderId: data.orderId, variantId: data.variantId }
        });
        if (existing) throw new BadRequestException('Return request already exists for this item');

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

    async getUserReturns(userId: number) {
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

    async updateStatus(id: number, status: string, note?: string) {
        return this.prisma.returnRequest.update({
            where: { id },
            data: { status, adminNote: note }
        });
    }

    async schedulePickup(id: number, data: any) {
        const returnReq = await this.prisma.returnRequest.findUnique({ where: { id } });
        if (!returnReq) throw new NotFoundException('Return request not found');

        // Upsert pickup
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

    async processRefund(id: number, data: any) {
        const returnReq = await this.prisma.returnRequest.findUnique({ where: { id } });
        if (!returnReq) throw new NotFoundException('Return request not found');

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
}
