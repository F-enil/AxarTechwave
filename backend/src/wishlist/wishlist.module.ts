import { Module } from '@nestjs/common';
import { WishlistController } from './wishlist.controller';
import { WishlistService } from './wishlist.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MediaModule } from '../media/media.module';

@Module({
    imports: [PrismaModule, MediaModule],
    controllers: [WishlistController],
    providers: [WishlistService],
})
export class WishlistModule { }
