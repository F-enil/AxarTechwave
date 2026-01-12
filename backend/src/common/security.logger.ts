
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SecurityLogger extends Logger {
    warn(message: string, context?: string) {
        // In production, this should send to ELK/CloudWatch/Slack
        super.warn(`[SECURITY ALERT] ${message}`, context);
    }

    logLoginFailure(email: string, reason: string, ip: string) {
        this.warn(`Failed Login Attempt | User: ${email} | Reason: ${reason} | IP: ${ip}`, 'AuthService');
    }

    logAccessDenied(userId: number | string, role: string, resource: string, ip: string) {
        this.warn(`Access Denied | User: ${userId} (${role}) | Target: ${resource} | IP: ${ip}`, 'AccessControl');
    }

    logPriceMismatch(userId: number, orderId: string, frontendTotal: number, backendTotal: number) {
        this.warn(`Price Mismatch Ignored/Rejected | User: ${userId} | Order: ${orderId} | FE: ${frontendTotal} | BE: ${backendTotal}`, 'FinancialIntegrity');
    }
}
