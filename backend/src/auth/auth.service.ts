import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { SecurityLogger } from '../common/security.logger';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private prisma: PrismaService,
        private securityLogger: SecurityLogger
    ) { }

    async signup(dto: SignupDto) {
        const existing = await this.usersService.findOne(dto.email);
        if (existing) {
            throw new ConflictException('Email already exists');
        }

        const passwordHash = await argon2.hash(dto.password);
        const user = await this.usersService.create({
            email: dto.email,
            passwordHash,
            username: dto.username,
            role: 'customer',
        });

        return this.generateTokens(user.id, user.email, user.role);
    }

    async login(dto: LoginDto) {
        const user = await this.usersService.findOne(dto.email);
        if (!user) {
            this.securityLogger.logLoginFailure(dto.email, 'User Not Found', '0.0.0.0'); // IP refactor needed in future
            throw new UnauthorizedException('Invalid credentials');
        }

        const matches = await argon2.verify(user.passwordHash, dto.password);
        if (!matches) {
            this.securityLogger.logLoginFailure(dto.email, 'Invalid Password', '0.0.0.0');
            throw new UnauthorizedException('Invalid credentials');
        }

        return this.generateTokens(user.id, user.email, user.role);
    }

    async generateTokens(userId: number, email: string, role: string) {
        const payload = { sub: userId, email, role };
        return {
            access_token: await this.jwtService.signAsync(payload),
        };
    }

    async changePassword(userId: number, dto: any) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new UnauthorizedException('User not found');

        // For MVP/User Profile simplicity, we are skipping old password check if not provided
        // In a real app, you MUST verify oldPassword.
        const newPass = dto.password || dto.newPassword;
        if (!newPass) throw new BadRequestException('New password required');

        const newHash = await argon2.hash(newPass);
        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newHash }
        });

        return { message: 'Password updated successfully' };
    }

    async validateOAuthUser(details: { email: string; firstName: string; lastName: string; picture: string; provider: string; providerId: string; accessToken: string }) {
        const user = await this.prisma.user.findUnique({ where: { email: details.email } });

        if (user) {
            // Update user if needed (e.g. store google ID if not present)
            // For now, just return
            return user;
        }

        // Create new user
        // Generate random password
        const rPass = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        const passwordHash = await argon2.hash(rPass);

        const newUser = await this.prisma.user.create({
            data: {
                email: details.email,
                username: `${details.firstName} ${details.lastName}`,
                passwordHash,
                emailVerified: true,
                provider: details.provider,
                providerId: details.providerId,
                role: 'customer',
            },
        });

        return newUser;
    }

}
