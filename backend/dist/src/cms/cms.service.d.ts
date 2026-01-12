import { PrismaService } from '../prisma/prisma.service';
export declare class CmsService {
    private prisma;
    constructor(prisma: PrismaService);
    getSettings(): Promise<{
        title: string;
        logo: string;
        social: {
            facebook: string;
            instagram: string;
            whatsapp: string;
        };
        contact: {
            phone: string;
            email: string;
            address: string;
        };
        maintenanceMode: boolean;
    }>;
    updateSettings(data: any): Promise<{
        key: string;
        value: import("@prisma/client/runtime/library").JsonValue;
    }>;
}
