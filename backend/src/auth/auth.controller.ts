import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Request, Get, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('signup')
    signup(@Body() signupDto: SignupDto) {
        return this.authService.signup(signupDto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    login(@Body() loginDto: LoginDto) {
        console.log('[Backend] Login Request:', loginDto.email);
        return this.authService.login(loginDto);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('change-password')
    changePassword(@Request() req, @Body() body: any) {
        return this.authService.changePassword(req.user.userId, body);
    }

    @UseGuards(AuthGuard('google'))
    @Get('google')
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    async googleAuth(@Request() req) { }

    @UseGuards(AuthGuard('google'))
    @Get('google/callback')
    async googleAuthRedirect(@Request() req, @Res() res) {
        const user = req.user;
        const tokens = await this.authService.generateTokens(user.id, user.email, user.role);

        // Redirect to frontend with token
        // We can use a query param or a temporary cookie. Query param is easiest for MVP.
        const frontendUrl = process.env.FRONTEND_URL || 'http://127.0.0.1:5500/axartechwavedemo.html';
        res.redirect(`${frontendUrl}?token=${tokens.access_token}`);
    }

}
