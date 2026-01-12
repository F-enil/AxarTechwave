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
exports.AddressService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AddressService = class AddressService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(userId) {
        return this.prisma.address.findMany({
            where: { userId },
            orderBy: { isDefault: 'desc' }
        });
    }
    async create(userId, data) {
        const count = await this.prisma.address.count({ where: { userId } });
        const isDefault = count === 0 ? true : (data.isDefault || false);
        if (isDefault) {
            await this.prisma.address.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false }
            });
        }
        return this.prisma.address.create({
            data: {
                userId,
                name: data.name,
                phone: data.phone,
                line1: data.line1,
                city: data.city,
                state: data.state,
                country: data.country,
                pincode: data.pincode,
                isDefault
            }
        });
    }
    async update(userId, addressId, data) {
        const address = await this.prisma.address.findUnique({ where: { id: addressId } });
        if (!address)
            throw new common_1.NotFoundException('Address not found');
        if (address.userId !== userId)
            throw new common_1.ForbiddenException('Access denied');
        if (data.isDefault) {
            await this.prisma.address.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false }
            });
        }
        return this.prisma.address.update({
            where: { id: addressId },
            data: {
                name: data.name,
                phone: data.phone,
                line1: data.line1,
                city: data.city,
                state: data.state,
                country: data.country,
                pincode: data.pincode,
                isDefault: data.isDefault
            }
        });
    }
    async remove(userId, addressId) {
        const address = await this.prisma.address.findUnique({ where: { id: addressId } });
        if (!address)
            throw new common_1.NotFoundException('Address not found');
        if (address.userId !== userId)
            throw new common_1.ForbiddenException('Access denied');
        return this.prisma.address.delete({ where: { id: addressId } });
    }
};
exports.AddressService = AddressService;
exports.AddressService = AddressService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AddressService);
//# sourceMappingURL=address.service.js.map