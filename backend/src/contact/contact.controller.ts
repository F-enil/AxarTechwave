import { Controller, Post, Body, Get, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { ContactService } from './contact.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('contact')
export class ContactController {
    constructor(private readonly contactService: ContactService) { }

    @Post()
    create(@Body() body: any) {
        // Public endpoint
        return this.contactService.create(body);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('admin/all')
    findAll(@Request() req) {
        if (req.user.role !== 'admin' && req.user.role !== 'staff') {
            throw new UnauthorizedException();
        }
        return this.contactService.findAll();
    }
}
