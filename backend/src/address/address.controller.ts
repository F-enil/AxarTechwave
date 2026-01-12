import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { AddressService } from './address.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('address')
@UseGuards(JwtAuthGuard)
export class AddressController {
    constructor(private readonly addressService: AddressService) { }

    @Get()
    findAll(@Request() req) {
        return this.addressService.findAll(req.user.userId);
    }

    @Post()
    create(@Request() req, @Body() body: any) {
        return this.addressService.create(req.user.userId, body);
    }

    @Put(':id')
    update(@Request() req, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
        return this.addressService.update(req.user.userId, id, body);
    }

    @Delete(':id')
    remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
        return this.addressService.remove(req.user.userId, id);
    }
}
