"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RmsController = void 0;
const common_1 = require("@nestjs/common");
const rms_service_1 = require("./rms.service");
const passport_1 = require("@nestjs/passport");
let RmsController = class RmsController {
    constructor(rmsService) {
        this.rmsService = rmsService;
    }
    createReturnRequest(req, body) {
        return this.rmsService.createReturnRequest(req.user.userId, body);
    }
    getMyReturns(req) {
        return this.rmsService.getUserReturns(req.user.userId);
    }
    getAllReturns(req) {
        this.checkAdmin(req);
        return this.rmsService.getAllReturns();
    }
    updateStatus(req, id, body) {
        this.checkAdmin(req);
        return this.rmsService.updateStatus(id, body.status, body.note);
    }
    schedulePickup(req, id, body) {
        this.checkAdmin(req);
        return this.rmsService.schedulePickup(id, body);
    }
    processRefund(req, id, body) {
        this.checkAdmin(req);
        return this.rmsService.processRefund(id, body);
    }
    checkAdmin(req) {
        if (req.user.role !== 'admin' && req.user.role !== 'staff') {
            throw new common_1.UnauthorizedException('Admin access required');
        }
    }
};
exports.RmsController = RmsController;
__decorate([
    (0, common_1.Post)('request'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RmsController.prototype, "createReturnRequest", null);
__decorate([
    (0, common_1.Get)('my-returns'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RmsController.prototype, "getMyReturns", null);
__decorate([
    (0, common_1.Get)('admin/all'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RmsController.prototype, "getAllReturns", null);
__decorate([
    (0, common_1.Put)('admin/:id/status'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object]),
    __metadata("design:returntype", void 0)
], RmsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)('admin/:id/pickup'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object]),
    __metadata("design:returntype", void 0)
], RmsController.prototype, "schedulePickup", null);
__decorate([
    (0, common_1.Post)('admin/:id/refund'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object]),
    __metadata("design:returntype", void 0)
], RmsController.prototype, "processRefund", null);
exports.RmsController = RmsController = __decorate([
    (0, common_1.Controller)('rms'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [rms_service_1.RmsService])
], RmsController);
//# sourceMappingURL=rms.controller.js.map