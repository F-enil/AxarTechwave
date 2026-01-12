import { PrismaService } from '../prisma/prisma.service';
export declare class NotificationService {
    private prisma;
    constructor(prisma: PrismaService);
    checkStockLevel(variantId: number, productTitle: string, currentStock: number): Promise<void>;
    sendAdminAlert(message: string): Promise<void>;
    private sendWhatsApp;
    private sendEmail;
}
