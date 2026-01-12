import { PrismaService } from '../prisma/prisma.service';
export declare class ContactService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: any): Promise<any>;
    findAll(): Promise<any>;
}
