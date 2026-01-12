import { CmsService } from './cms.service';
export declare class CmsController {
    private readonly cmsService;
    constructor(cmsService: CmsService);
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
    updateSettings(body: any): Promise<{
        key: string;
        value: import("@prisma/client/runtime/library").JsonValue;
    }>;
}
