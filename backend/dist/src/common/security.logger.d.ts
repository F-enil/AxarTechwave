import { Logger } from '@nestjs/common';
export declare class SecurityLogger extends Logger {
    warn(message: string, context?: string): void;
    logLoginFailure(email: string, reason: string, ip: string): void;
    logAccessDenied(userId: number | string, role: string, resource: string, ip: string): void;
    logPriceMismatch(userId: number, orderId: string, frontendTotal: number, backendTotal: number): void;
}
