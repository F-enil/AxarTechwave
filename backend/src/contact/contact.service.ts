import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContactService {
    constructor(private prisma: PrismaService) { }

    async create(data: any) {
        return (this.prisma as any).contactMessage.create({
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                subject: data.subject,
                message: data.message
            }
        });
    }

    async findAll() {
        return (this.prisma as any).contactMessage.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }
}
