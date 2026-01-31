import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MerchantController } from './merchant.controller';
import { MerchantService } from './merchant.service';
import { PrismaService } from '../prisma.service';

@Module({
    imports: [ScheduleModule.forRoot()],
    controllers: [MerchantController],
    providers: [MerchantService, PrismaService],
})
export class MerchantModule { }
