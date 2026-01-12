import { PrismaService } from '../prisma/prisma.service';
export declare class AddressService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(userId: number): Promise<{
        id: number;
        userId: number;
        name: string;
        phone: string;
        line1: string;
        city: string;
        state: string;
        country: string;
        pincode: string;
        isDefault: boolean;
    }[]>;
    create(userId: number, data: any): Promise<{
        id: number;
        userId: number;
        name: string;
        phone: string;
        line1: string;
        city: string;
        state: string;
        country: string;
        pincode: string;
        isDefault: boolean;
    }>;
    update(userId: number, addressId: number, data: any): Promise<{
        id: number;
        userId: number;
        name: string;
        phone: string;
        line1: string;
        city: string;
        state: string;
        country: string;
        pincode: string;
        isDefault: boolean;
    }>;
    remove(userId: number, addressId: number): Promise<{
        id: number;
        userId: number;
        name: string;
        phone: string;
        line1: string;
        city: string;
        state: string;
        country: string;
        pincode: string;
        isDefault: boolean;
    }>;
}
