import { Module } from '@nestjs/common';
import { RmsController } from './rms.controller';
import { RmsService } from './rms.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [RmsController],
    providers: [RmsService],
})
export class RmsModule { }
