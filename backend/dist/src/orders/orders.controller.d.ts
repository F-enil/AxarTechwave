import { Response } from 'express';
import { OrdersService } from './orders.service';
import { InvoicesService } from './invoices.service';
export declare class OrdersController {
    private readonly ordersService;
    private readonly invoiceService;
    constructor(ordersService: OrdersService, invoiceService: InvoicesService);
    createOrder(req: any, body: {
        shippingAddress: any;
        gstNumber?: string;
        paymentMethod?: string;
    }): Promise<{
        items: {
            id: number;
            variantId: number;
            title: string;
            sku: string;
            price: import("@prisma/client/runtime/library").Decimal;
            quantity: number;
            orderId: number;
        }[];
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
    }>;
    getOrders(req: any): Promise<any>;
    getAllOrders(): Promise<any>;
    exportOrders(res: Response): Promise<void>;
    getOrderByIdAdmin(id: number): Promise<any>;
    getInvoice(id: number, req: any, res: Response): Promise<void>;
    verifyPayment(id: number, body: {
        paymentId: string;
        signature: string;
    }): Promise<{
        success: boolean;
    }>;
    updateStatus(id: number, body: {
        status: string;
    }): Promise<{
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
    }>;
    updateTracking(id: number, body: {
        trackingId: string;
        courierCompanyName: string;
        status?: string;
    }): Promise<{
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
    }>;
}
