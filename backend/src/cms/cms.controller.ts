import { Controller, Get, Put, Body, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
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
}
