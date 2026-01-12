import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from '../prisma/prisma.service';
import { SecurityLogger } from '../common/security.logger';
export declare class AuthService {
    private usersService;
    private jwtService;
    private prisma;
    private securityLogger;
    constructor(usersService: UsersService, jwtService: JwtService, prisma: PrismaService, securityLogger: SecurityLogger);
    signup(dto: SignupDto): Promise<{
        access_token: string;
    }>;
    login(dto: LoginDto): Promise<{
        access_token: string;
    }>;
    generateTokens(userId: number, email: string, role: string): Promise<{
        access_token: string;
    }>;
    changePassword(userId: number, dto: any): Promise<{
        message: string;
    }>;
    validateOAuthUser(details: {
        email: string;
        firstName: string;
        lastName: string;
        picture: string;
        provider: string;
        providerId: string;
        accessToken: string;
    }): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        gstNumber: string | null;
        email: string;
        username: string | null;
        passwordHash: string;
        emailVerified: boolean;
        role: string;
        twofaSecret: string | null;
        provider: string;
        providerId: string | null;
    }>;
}
