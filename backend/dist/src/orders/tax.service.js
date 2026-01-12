"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaxService = void 0;
const common_1 = require("@nestjs/common");
let TaxService = class TaxService {
    calculateTax(amount, state, taxRate = 18) {
        const isGujarat = state && state.toLowerCase().trim() === 'gujarat';
        const rate = Number(taxRate) || 18;
        let cgst = 0;
        let sgst = 0;
        let igst = 0;
        if (isGujarat) {
            const halfRate = rate / 2;
            cgst = Number(((amount * halfRate) / 100).toFixed(2));
            sgst = Number(((amount * halfRate) / 100).toFixed(2));
        }
        else {
            igst = Number(((amount * rate) / 100).toFixed(2));
        }
        const totalTax = Number((cgst + sgst + igst).toFixed(2));
        return {
            taxableAmount: amount,
            cgst,
            sgst,
            igst,
            totalTax,
            taxRate: rate,
            type: isGujarat ? 'intra_state' : 'inter_state'
        };
    }
    calculateItemTax(price, quantity, state, rates) {
        const amount = Number(price) * quantity;
        const isGujarat = state && state.toLowerCase().trim() === 'gujarat';
        let cgst = 0;
        let sgst = 0;
        let igst = 0;
        if (isGujarat) {
            cgst = Number(((amount * rates.cgst) / 100).toFixed(2));
            sgst = Number(((amount * rates.sgst) / 100).toFixed(2));
        }
        else {
            igst = Number(((amount * rates.igst) / 100).toFixed(2));
        }
        return {
            taxableAmount: amount,
            cgst,
            sgst,
            igst,
            totalTax: Number((cgst + sgst + igst).toFixed(2))
        };
    }
};
exports.TaxService = TaxService;
exports.TaxService = TaxService = __decorate([
    (0, common_1.Injectable)()
], TaxService);
//# sourceMappingURL=tax.service.js.map