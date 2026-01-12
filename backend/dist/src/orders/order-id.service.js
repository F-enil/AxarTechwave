"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderIdService = void 0;
const common_1 = require("@nestjs/common");
let OrderIdService = class OrderIdService {
    generateOrderId() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let random = '';
        for (let i = 0; i < 6; i++) {
            random += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return `AXAR-${year}${month}${day}-${random}`;
    }
};
exports.OrderIdService = OrderIdService;
exports.OrderIdService = OrderIdService = __decorate([
    (0, common_1.Injectable)()
], OrderIdService);
//# sourceMappingURL=order-id.service.js.map