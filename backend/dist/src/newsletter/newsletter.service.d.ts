import { PrismaService } from '../prisma/prisma.service';
export declare class NewsletterService {
    private prisma;
    constructor(prisma: PrismaService);
    subscribe(email: string): Promise<{
        message: string;
        subscriber: any;
    }>;
    findAll(): Promise<any>;
}
