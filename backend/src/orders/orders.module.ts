import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CartModule } from '../cart/cart.module';
import { MediaModule } from '../media/media.module';
import { NotificationModule } from '../notifications/notification.module';

import { TaxService } from './tax.service';
import { OrderIdService } from './order-id.service';
import { InvoicesService } from './invoices.service';

@Module({
    imports: [PrismaModule, CartModule, MediaModule, NotificationModule],
    controllers: [OrdersController],
    providers: [OrdersService, TaxService, OrderIdService, InvoicesService],
    exports: [OrdersService, TaxService, InvoicesService]
})
export class OrdersModule { }
