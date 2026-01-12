import { PrismaService } from '../prisma/prisma.service';
export declare class InvoicesService {
    private prisma;
    constructor(prisma: PrismaService);
    generateInvoice(orderId: number): Promise<Buffer>;
}
