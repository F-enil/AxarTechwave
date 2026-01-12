"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceService = void 0;
const common_1 = require("@nestjs/common");
const PDFDocument = require("pdfkit");
const qr = require("qr-image");
const fs = require("fs");
const path = require("path");
let InvoiceService = class InvoiceService {
    async generateInvoice(order, stream) {
        var _a, _b, _c;
        const doc = new PDFDocument({ margin: 50 });
        doc.pipe(stream);
        const primaryColor = '#003040';
        const logoPath = path.join(process.cwd(), '../images/logo.png');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 50, 45, { width: 50 });
        }
        doc
            .fillColor(primaryColor)
            .fontSize(20)
            .text('INVOICE', 50, 57, { align: 'right' })
            .fontSize(10)
            .text(`Invoice Number: ${((_b = (_a = order.invoices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.invoiceNo) || order.customId || order.id}`, { align: 'right' })
            .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, { align: 'right' })
            .text(`Order ID: ${order.customId || order.id}`, { align: 'right' });
        doc.moveDown();
        doc
            .text('From:', 50, 130)
            .font('Helvetica-Bold')
            .text('Axar TechWave', 50, 145)
            .font('Helvetica')
            .text('Surat, Gujarat', 50, 160)
            .text('GSTIN: 24ACKFA5069R1ZQ', 50, 175);
        const shipping = order.shippingAddress || {};
        doc
            .text('Bill To:', 300, 130)
            .font('Helvetica-Bold')
            .text(shipping.name || ((_c = order.user) === null || _c === void 0 ? void 0 : _c.username) || 'Guest', 300, 145)
            .font('Helvetica')
            .text(shipping.line1 || '', 300, 160)
            .text(`${shipping.city || ''}, ${shipping.state || ''} ${shipping.pincode || ''}`, 300, 175)
            .text(`GSTIN: ${order.gstNumber || 'N/A'}`, 300, 190);
        doc.moveDown();
        let y = 230;
        doc
            .font('Helvetica-Bold')
            .text('Item', 50, y)
            .text('Qty', 280, y, { width: 90, align: 'right' })
            .text('Price', 370, y, { width: 90, align: 'right' })
            .text('Total', 0, y, { align: 'right' });
        doc
            .moveTo(50, y + 15)
            .lineTo(550, y + 15)
            .stroke();
        y += 30;
        doc.font('Helvetica');
        let subtotal = 0;
        order.items.forEach(item => {
            const total = Number(item.price) * item.quantity;
            subtotal += total;
            doc
                .text(item.title.substring(0, 40), 50, y)
                .text(item.quantity.toString(), 280, y, { width: 90, align: 'right' })
                .text(`Rs. ${item.price}`, 370, y, { width: 90, align: 'right' })
                .text(`Rs. ${total.toFixed(2)}`, 0, y, { align: 'right' });
            y += 20;
        });
        doc
            .moveTo(50, y + 10)
            .lineTo(550, y + 10)
            .stroke();
        y += 20;
        const tax = order.taxDetails || { totalTax: 0, cgst: 0, sgst: 0, igst: 0 };
        const shippingCost = 50;
        doc.font('Helvetica-Bold');
        doc.text('Subtotal:', 350, y, { width: 90, align: 'right' });
        doc.text(`Rs. ${subtotal.toFixed(2)}`, 0, y, { align: 'right' });
        y += 20;
        doc.font('Helvetica');
        if (tax.cgst > 0) {
            doc.text(`CGST (${tax.taxRate / 2}%):`, 350, y, { width: 90, align: 'right' });
            doc.text(`Rs. ${tax.cgst}`, 0, y, { align: 'right' });
            y += 15;
            doc.text(`SGST (${tax.taxRate / 2}%):`, 350, y, { width: 90, align: 'right' });
            doc.text(`Rs. ${tax.sgst}`, 0, y, { align: 'right' });
            y += 15;
        }
        else if (tax.igst > 0) {
            doc.text(`IGST (${tax.taxRate}%):`, 350, y, { width: 90, align: 'right' });
            doc.text(`Rs. ${tax.igst}`, 0, y, { align: 'right' });
            y += 15;
        }
        doc.text('Shipping:', 350, y, { width: 90, align: 'right' });
        doc.text(`Rs. ${shippingCost.toFixed(2)}`, 0, y, { align: 'right' });
        y += 20;
        doc.font('Helvetica-Bold').fontSize(12);
        doc.text('Grand Total:', 350, y, { width: 90, align: 'right' });
        doc.text(`Rs. ${order.total}`, 0, y, { align: 'right' });
        const qrSvg = qr.imageSync(`Payment Ref: ${order.customId} | Amount: ${order.total}`, { type: 'png' });
        doc.image(qrSvg, 50, 650, { width: 100 });
        doc.fontSize(10).text('Scan for Order Details', 50, 760);
        doc.end();
    }
};
exports.InvoiceService = InvoiceService;
exports.InvoiceService = InvoiceService = __decorate([
    (0, common_1.Injectable)()
], InvoiceService);
//# sourceMappingURL=invoice.service.js.map