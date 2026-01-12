import { Body, Controller, Post, Get, BadRequestException } from '@nestjs/common';
import { NewsletterService } from './newsletter.service';

@Controller('newsletter')
export class NewsletterController {
    constructor(private readonly newsletterService: NewsletterService) { }

    @Post('subscribe')
    async subscribe(@Body('email') email: string) {
        if (!email || !email.includes('@')) {
            throw new BadRequestException('Invalid email address');
        }
        return this.newsletterService.subscribe(email);
    }
    @Get()
    async findAll() {
        // In a real app, use @UseGuards(JwtAuthGuard) and check for admin role
        return this.newsletterService.findAll();
    }
}
