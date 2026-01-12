import { Controller, Put, Body, UseGuards, Request, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @UseGuards(AuthGuard('jwt'))
    @Get('profile')
    async getProfile(@Request() req) {
        const user = await this.usersService.findById(req.user.userId);
        const { passwordHash, ...result } = user;
        return result;
    }

    @UseGuards(AuthGuard('jwt'))
    @Put('profile')
    async updateProfile(@Request() req, @Body() body: any) {
        // Simple validation/filtering
        const { username, email } = body;
        const data: any = {};
        if (username) data.username = username;
        if (email) data.email = email;

        const updatedUser = await this.usersService.update(req.user.userId, data);
        const { passwordHash, ...result } = updatedUser;
        return result;
    }
}
