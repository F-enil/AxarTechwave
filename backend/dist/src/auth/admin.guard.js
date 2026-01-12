"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminGuard = void 0;
const common_1 = require("@nestjs/common");
const security_logger_1 = require("../common/security.logger");
let AdminGuard = class AdminGuard {
    constructor() {
        this.logger = new security_logger_1.SecurityLogger();
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const ip = request.ip || '0.0.0.0';
        if (!user || user.role !== 'admin') {
            this.logger.logAccessDenied((user === null || user === void 0 ? void 0 : user.id) || 'Anonymous', (user === null || user === void 0 ? void 0 : user.role) || 'Guest', request.url, ip);
            throw new common_1.ForbiddenException('Access Denied: Admins Only');
        }
        return true;
    }
};
exports.AdminGuard = AdminGuard;
exports.AdminGuard = AdminGuard = __decorate([
    (0, common_1.Injectable)()
], AdminGuard);
//# sourceMappingURL=admin.guard.js.map