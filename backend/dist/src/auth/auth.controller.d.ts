import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    signup(signupDto: SignupDto): Promise<{
        access_token: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
    }>;
    changePassword(req: any, body: any): Promise<{
        message: string;
    }>;
    googleAuth(req: any): Promise<void>;
    googleAuthRedirect(req: any, res: any): Promise<void>;
}
