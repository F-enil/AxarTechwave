import { AddressService } from './address.service';
export declare class AddressController {
    private readonly addressService;
    constructor(addressService: AddressService);
    findAll(req: any): Promise<{
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
    create(req: any, body: any): Promise<{
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
    update(req: any, id: number, body: any): Promise<{
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
    remove(req: any, id: number): Promise<{
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
