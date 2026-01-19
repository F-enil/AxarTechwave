import { Controller, Get, Put, Body, UseGuards, Request, UnauthorizedException, Delete } from '@nestjs/common';
import { CmsService } from './cms.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('cms')
export class CmsController {
    constructor(private readonly cmsService: CmsService) { }

    @Get('settings')
    getSettings() {
        return this.cmsService.getSettings();
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('admin')
    @Put('settings')
    updateSettings(@Body() body: any) {
        return this.cmsService.updateSettings(body);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('admin')
    @Get('admin/trigger-reset') // Using GET so we can easily test or use simple fetch, but DELETE better. User wants simple.
    // Let's stick to standard methods.
    // Actually, making it DELETE /cms/reset-database
    @Delete('reset-database')
    async triggerReset() {
        return this.cmsService.resetDatabase();
    }
}
