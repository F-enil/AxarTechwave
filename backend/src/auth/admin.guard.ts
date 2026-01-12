import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SecurityLogger } from '../common/security.logger';

@Injectable()
export class AdminGuard implements CanActivate {
    private logger = new SecurityLogger();

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const ip = request.ip || '0.0.0.0';

        if (!user || user.role !== 'admin') {
            this.logger.logAccessDenied(user?.id || 'Anonymous', user?.role || 'Guest', request.url, ip);
            throw new ForbiddenException('Access Denied: Admins Only');
        }
        return true;
    }
}
