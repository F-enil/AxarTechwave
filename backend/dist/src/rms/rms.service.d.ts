import { PrismaService } from '../prisma/prisma.service';
export declare class RmsService {
    private prisma;
    constructor(prisma: PrismaService);
    createReturnRequest(userId: number, data: any): Promise<{
        id: number;
        userId: number;
        createdAt: Date;
        updatedAt: Date;
        variantId: number;
        status: string;
        orderId: number;
        type: string;
        reason: string;
        images: import("@prisma/client/runtime/library").JsonValue | null;
        adminNote: string | null;
    }>;
    getUserReturns(userId: number): Promise<({
        variant: {
            product: {
                id: number;
                createdAt: Date;
                updatedAt: Date;
                title: string;
                status: string;
                slug: string;
                description: string | null;
                taxClassId: string | null;
                hsnSac: string | null;
                brand: string | null;
                categoryId: number | null;
                originCountry: string | null;
                taxRate: number;
                cgst: number;
                sgst: number;
                igst: number;
            };
        } & {
            id: number;
            productId: number;
            sku: string;
            barcode: string | null;
            attributes: import("@prisma/client/runtime/library").JsonValue | null;
            weight: number | null;
            dimensions: import("@prisma/client/runtime/library").JsonValue | null;
            status: string;
        };
        order: {
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
        };
        pickup: {
            id: number;
            createdAt: Date;
            status: string;
            returnRequestId: number;
            courierName: string;
            trackingNumber: string;
            pickupDate: Date | null;
        };
        refund: {
            id: number;
            createdAt: Date;
            status: string;
            transactionId: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            returnRequestId: number;
            method: string;
            processedAt: Date | null;
        };
    } & {
        id: number;
        userId: number;
        createdAt: Date;
        updatedAt: Date;
        variantId: number;
        status: string;
        orderId: number;
        type: string;
        reason: string;
        images: import("@prisma/client/runtime/library").JsonValue | null;
        adminNote: string | null;
    })[]>;
    getAllReturns(): Promise<({
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
        variant: {
            product: {
                id: number;
                createdAt: Date;
                updatedAt: Date;
                title: string;
                status: string;
                slug: string;
                description: string | null;
                taxClassId: string | null;
                hsnSac: string | null;
                brand: string | null;
                categoryId: number | null;
                originCountry: string | null;
                taxRate: number;
                cgst: number;
                sgst: number;
                igst: number;
            };
        } & {
            id: number;
            productId: number;
            sku: string;
            barcode: string | null;
            attributes: import("@prisma/client/runtime/library").JsonValue | null;
            weight: number | null;
            dimensions: import("@prisma/client/runtime/library").JsonValue | null;
            status: string;
        };
        order: {
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
        };
        pickup: {
            id: number;
            createdAt: Date;
            status: string;
            returnRequestId: number;
            courierName: string;
            trackingNumber: string;
            pickupDate: Date | null;
        };
        refund: {
            id: number;
            createdAt: Date;
            status: string;
            transactionId: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            returnRequestId: number;
            method: string;
            processedAt: Date | null;
        };
    } & {
        id: number;
        userId: number;
        createdAt: Date;
        updatedAt: Date;
        variantId: number;
        status: string;
        orderId: number;
        type: string;
        reason: string;
        images: import("@prisma/client/runtime/library").JsonValue | null;
        adminNote: string | null;
    })[]>;
    updateStatus(id: number, status: string, note?: string): Promise<{
        id: number;
        userId: number;
        createdAt: Date;
        updatedAt: Date;
        variantId: number;
        status: string;
        orderId: number;
        type: string;
        reason: string;
        images: import("@prisma/client/runtime/library").JsonValue | null;
        adminNote: string | null;
    }>;
    schedulePickup(id: number, data: any): Promise<{
        id: number;
        createdAt: Date;
        status: string;
        returnRequestId: number;
        courierName: string;
        trackingNumber: string;
        pickupDate: Date | null;
    }>;
    processRefund(id: number, data: any): Promise<{
        id: number;
        createdAt: Date;
        status: string;
        transactionId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        returnRequestId: number;
        method: string;
        processedAt: Date | null;
    }>;
}
