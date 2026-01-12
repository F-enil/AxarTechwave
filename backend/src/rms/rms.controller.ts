import { Controller, Post, Get, Put, UseGuards, Request, Body, Param, ParseIntPipe, UnauthorizedException } from '@nestjs/common';
import { RmsService } from './rms.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('rms')
@UseGuards(AuthGuard('jwt'))
export class RmsController {
    constructor(private readonly rmsService: RmsService) { }

    @Post('request')
    createReturnRequest(@Request() req, @Body() body: any) {
        return this.rmsService.createReturnRequest(req.user.userId, body);
    }

    @Get('my-returns')
    getMyReturns(@Request() req) {
        return this.rmsService.getUserReturns(req.user.userId);
    }

    // Admin Routes
    @Get('admin/all')
    getAllReturns(@Request() req) {
        this.checkAdmin(req);
        return this.rmsService.getAllReturns();
    }

    @Put('admin/:id/status')
    updateStatus(@Request() req, @Param('id', ParseIntPipe) id: number, @Body() body: { status: string, note?: string }) {
        this.checkAdmin(req);
        return this.rmsService.updateStatus(id, body.status, body.note);
    }

    @Post('admin/:id/pickup')
    schedulePickup(@Request() req, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
        this.checkAdmin(req);
        return this.rmsService.schedulePickup(id, body);
    }

    @Post('admin/:id/refund')
    processRefund(@Request() req, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
        this.checkAdmin(req);
        return this.rmsService.processRefund(id, body);
    }

    private checkAdmin(req) {
        if (req.user.role !== 'admin' && req.user.role !== 'staff') {
            throw new UnauthorizedException('Admin access required');
        }
    }
}
