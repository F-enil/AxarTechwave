import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(req: any): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        gstNumber: string | null;
        email: string;
        username: string | null;
        emailVerified: boolean;
        role: string;
        twofaSecret: string | null;
        provider: string;
        providerId: string | null;
    }>;
    updateProfile(req: any, body: any): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        gstNumber: string | null;
        email: string;
        username: string | null;
        emailVerified: boolean;
        role: string;
        twofaSecret: string | null;
        provider: string;
        providerId: string | null;
    }>;
}
