import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AddressService {
    constructor(private prisma: PrismaService) { }

    async findAll(userId: number) {
        return this.prisma.address.findMany({
            where: { userId },
            orderBy: { isDefault: 'desc' } // Defaults first
        });
    }

    async create(userId: number, data: any) {
        // If this is the first address, make it default
        const count = await this.prisma.address.count({ where: { userId } });
        const isDefault = count === 0 ? true : (data.isDefault || false);

        if (isDefault) {
            // Unset other defaults
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

    async update(userId: number, addressId: number, data: any) {
        const address = await this.prisma.address.findUnique({ where: { id: addressId } });
        if (!address) throw new NotFoundException('Address not found');
        if (address.userId !== userId) throw new ForbiddenException('Access denied');

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

    async remove(userId: number, addressId: number) {
        const address = await this.prisma.address.findUnique({ where: { id: addressId } });
        if (!address) throw new NotFoundException('Address not found');
        if (address.userId !== userId) throw new ForbiddenException('Access denied');

        return this.prisma.address.delete({ where: { id: addressId } });
    }
}
