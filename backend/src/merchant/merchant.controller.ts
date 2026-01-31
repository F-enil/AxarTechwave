import { Controller, Post, UseGuards, Res, HttpStatus } from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Response } from 'express';

@Controller('merchant')
export class MerchantController {
    constructor(private readonly merchantService: MerchantService) { }

    @Post('sync')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    async triggerSync(@Res() res: Response) {
        try {
            const result = await this.merchantService.syncProducts();
            return res.status(HttpStatus.OK).json({
                message: 'Google Merchant Center sync triggered successfully',
                details: result,
            });
        } catch (error) {
            console.error('Manual sync failed:', error);
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: 'Sync failed',
                error: error.message,
            });
        }
    }
}
