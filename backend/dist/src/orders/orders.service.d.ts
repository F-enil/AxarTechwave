import { PrismaService } from '../prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { MediaService } from '../media/media.service';
import { NotificationService } from '../notifications/notification.service';
import { InvoicesService } from './invoices.service';
import { TaxService } from './tax.service';
import { OrderIdService } from './order-id.service';
export declare class OrdersService {
    private prisma;
    private cartService;
    private mediaService;
    private notificationService;
    private taxService;
    private orderIdService;
    private invoiceService;
    constructor(prisma: PrismaService, cartService: CartService, mediaService: MediaService, notificationService: NotificationService, taxService: TaxService, orderIdService: OrderIdService, invoiceService: InvoicesService);
    createOrder(userId: number, shippingAddress: any, gstNumber?: string, paymentMethod?: string): Promise<{
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
    getOrders(userId: number): Promise<any>;
    findAllOrders(): Promise<any>;
    getOrderById(id: number, userId?: number): Promise<any>;
    exportOrders(): Promise<string>;
    private generateCsv;
    verifyPayment(orderId: number, paymentId: string, signature: string): Promise<{
        success: boolean;
    }>;
    updateStatus(id: number, status: string): Promise<{
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
    updateTracking(id: number, trackingId: string, courierCompanyName: string, status?: string): Promise<{
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
    private processOrderImages;
}
