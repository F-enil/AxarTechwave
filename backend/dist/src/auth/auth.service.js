"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/users.service");
const jwt_1 = require("@nestjs/jwt");
const argon2 = require("argon2");
const prisma_service_1 = require("../prisma/prisma.service");
const security_logger_1 = require("../common/security.logger");
let AuthService = class AuthService {
    constructor(usersService, jwtService, prisma, securityLogger) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.prisma = prisma;
        this.securityLogger = securityLogger;
    }
    async signup(dto) {
        const existing = await this.usersService.findOne(dto.email);
        if (existing) {
            throw new common_1.ConflictException('Email already exists');
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
    async login(dto) {
        const user = await this.usersService.findOne(dto.email);
        if (!user) {
            this.securityLogger.logLoginFailure(dto.email, 'User Not Found', '0.0.0.0');
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const matches = await argon2.verify(user.passwordHash, dto.password);
        if (!matches) {
            this.securityLogger.logLoginFailure(dto.email, 'Invalid Password', '0.0.0.0');
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        return this.generateTokens(user.id, user.email, user.role);
    }
    async generateTokens(userId, email, role) {
        const payload = { sub: userId, email, role };
        return {
            access_token: await this.jwtService.signAsync(payload),
        };
    }
    async changePassword(userId, dto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.UnauthorizedException('User not found');
        const newPass = dto.password || dto.newPassword;
        if (!newPass)
            throw new common_1.BadRequestException('New password required');
        const newHash = await argon2.hash(newPass);
        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newHash }
        });
        return { message: 'Password updated successfully' };
    }
    async validateOAuthUser(details) {
        const user = await this.prisma.user.findUnique({ where: { email: details.email } });
        if (user) {
            return user;
        }
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        prisma_service_1.PrismaService,
        security_logger_1.SecurityLogger])
], AuthService);
//# sourceMappingURL=auth.service.js.map