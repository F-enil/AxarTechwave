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
exports.OrdersController = void 0;
const common_1 = require("@nestjs/common");
const orders_service_1 = require("./orders.service");
const invoices_service_1 = require("./invoices.service");
const passport_1 = require("@nestjs/passport");
const admin_guard_1 = require("../auth/admin.guard");
let OrdersController = class OrdersController {
    constructor(ordersService, invoiceService) {
        this.ordersService = ordersService;
        this.invoiceService = invoiceService;
    }
    createOrder(req, body) {
        return this.ordersService.createOrder(req.user.userId, body.shippingAddress, body.gstNumber, body.paymentMethod);
    }
    getOrders(req) {
        return this.ordersService.getOrders(req.user.userId);
    }
    getAllOrders() {
        return this.ordersService.findAllOrders();
    }
    async exportOrders(res) {
        console.log('!!! CONTROLLER REACHED - EXPORT ENDPOINT !!!');
        const csv = await this.ordersService.exportOrders();
        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', 'attachment; filename="orders_v2.csv"');
        res.send(csv);
    }
    async getOrderByIdAdmin(id) {
        return this.ordersService.getOrderById(id);
    }
    async getInvoice(id, req, res) {
        if (req.user.role !== 'admin') {
            const order = await this.ordersService.getOrderById(id, req.user.userId);
            if (!order) {
                throw new common_1.UnauthorizedException('You do not have permission to view this invoice');
            }
        }
        try {
            const pdfBuffer = await this.invoiceService.generateInvoice(id);
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="invoice_${id}.pdf"`,
                'Content-Length': pdfBuffer.length,
            });
            res.end(pdfBuffer);
        }
        catch (e) {
            console.error(e);
            res.status(500).send('Error generating invoice');
        }
    }
    verifyPayment(id, body) {
        return this.ordersService.verifyPayment(id, body.paymentId, body.signature);
    }
    updateStatus(id, body) {
        return this.ordersService.updateStatus(id, body.status);
    }
    updateTracking(id, body) {
        return this.ordersService.updateTracking(id, body.trackingId, body.courierCompanyName, body.status);
    }
};
exports.OrdersController = OrdersController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "getOrders", null);
__decorate([
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.Get)('admin/all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "getAllOrders", null);
__decorate([
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.Get)('admin/download-csv-v3'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "exportOrders", null);
__decorate([
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.Get)('admin/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getOrderByIdAdmin", null);
__decorate([
    (0, common_1.Get)(':id/invoice'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getInvoice", null);
__decorate([
    (0, common_1.Post)(':id/verify-payment'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "verifyPayment", null);
__decorate([
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.Post)(':id/status'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.Post)(':id/tracking'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "updateTracking", null);
exports.OrdersController = OrdersController = __decorate([
    (0, common_1.Controller)('orders'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [orders_service_1.OrdersService,
        invoices_service_1.InvoicesService])
], OrdersController);
//# sourceMappingURL=orders.controller.js.map