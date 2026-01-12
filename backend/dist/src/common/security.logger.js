"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityLogger = void 0;
const common_1 = require("@nestjs/common");
let SecurityLogger = class SecurityLogger extends common_1.Logger {
    warn(message, context) {
        super.warn(`[SECURITY ALERT] ${message}`, context);
    }
    logLoginFailure(email, reason, ip) {
        this.warn(`Failed Login Attempt | User: ${email} | Reason: ${reason} | IP: ${ip}`, 'AuthService');
    }
    logAccessDenied(userId, role, resource, ip) {
        this.warn(`Access Denied | User: ${userId} (${role}) | Target: ${resource} | IP: ${ip}`, 'AccessControl');
    }
    logPriceMismatch(userId, orderId, frontendTotal, backendTotal) {
        this.warn(`Price Mismatch Ignored/Rejected | User: ${userId} | Order: ${orderId} | FE: ${frontendTotal} | BE: ${backendTotal}`, 'FinancialIntegrity');
    }
};
exports.SecurityLogger = SecurityLogger;
exports.SecurityLogger = SecurityLogger = __decorate([
    (0, common_1.Injectable)()
], SecurityLogger);
//# sourceMappingURL=security.logger.js.map