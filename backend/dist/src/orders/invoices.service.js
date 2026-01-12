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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoicesService = void 0;
const common_1 = require("@nestjs/common");
const PDFDocument = require("pdfkit");
const qr = require("qr-image");
const prisma_service_1 = require("../prisma/prisma.service");
const fs = require("fs");
const path = require("path");
function numberToWords(amount) {
    return `${amount} (In Words)`;
}
const sellerName = 'Axar TechWave';
const sellerAddress = '123 Tech Park, Surat, Gujarat, 395007';
const sellerPAN = 'ABCDE1234F';
const sellerGST = '24ABCDE1234F1Z5';
const margin = 50;
const pageWidth = 595.28;
const contentWidth = pageWidth - 2 * margin;
const centerX = pageWidth / 2;
let InvoicesService = class InvoicesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateInvoice(orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: { include: { addresses: true } },
                items: {
                    include: {
                        variant: {
                            include: {
                                product: true
                            }
                        }
                    }
                },
                payments: true,
                invoices: true,
            },
        });
        if (!order)
            throw new Error('Order not found');
        let invoiceNo = `INV-${new Date().getFullYear()}-${order.id.toString().padStart(4, '0')}`;
        if (order.invoices && order.invoices.length > 0) {
            invoiceNo = order.invoices[0].invoiceNo;
        }
        else {
            try {
                await this.prisma.invoice.create({
                    data: {
                        orderId: order.id,
                        invoiceNo: invoiceNo,
                        url: ''
                    }
                });
            }
            catch (e) {
                console.log('Invoice creation race condition or error:', e.message);
            }
        }
        const invoiceDate = order.createdAt.toLocaleDateString('en-IN');
        return new Promise((resolve, reject) => {
            var _a, _b;
            const doc = new PDFDocument({ margin: 20, size: 'A4' });
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);
            const pageWidth = 595;
            const margin = 20;
            const contentWidth = pageWidth - (margin * 2);
            const centerX = pageWidth / 2;
            const sellerName = "Axar TechWave";
            const sellerAddress = "Shop No. G-11, Madhav Crest Nr. D-MART, New Dindoli Deladva Gam, Surat, Gujarat 394210";
            const sellerPAN = "ACKFA5069R";
            const sellerGST = "24ACKFA5069R1ZQ";
            const invoiceDate = new Date().toLocaleDateString('en-IN');
            doc.fontSize(14).font('Helvetica-Bold')
                .text('Tax Invoice/Bill of Supply/Cash Memo', 0, margin, { align: 'right', width: pageWidth - margin });
            doc.fontSize(10).font('Helvetica')
                .text('(Triplicate for Supplier)', 0, margin + 18, { align: 'right', width: pageWidth - margin });
            const logoPath = path.join(process.cwd(), '../images/logo.png');
            if (fs.existsSync(logoPath)) {
                try {
                    doc.image(logoPath, margin, margin, { width: 100 });
                }
                catch (e) {
                    console.error('Logo Error:', e.message);
                }
            }
            else {
                doc.fontSize(24).font('Helvetica-Bold').text('AxarTechWave', margin, margin);
            }
            const topSectionY = 150;
            doc.fontSize(10).font('Helvetica-Bold').text('Sold By :', margin, topSectionY);
            doc.font('Helvetica').text(sellerName, margin, topSectionY + 15);
            doc.text(sellerAddress, margin, topSectionY + 30, { width: 250 });
            doc.font('Helvetica-Bold').text(`PAN No: ${sellerPAN}`, margin, topSectionY + 75);
            doc.text(`GST Registration No: ${sellerGST}`, margin, topSectionY + 90);
            const rightColWidth = 250;
            const rightColX = pageWidth - margin - rightColWidth;
            let rightY = topSectionY;
            let billingAddress = {};
            try {
                billingAddress = typeof order.shippingAddress === 'string'
                    ? JSON.parse(order.shippingAddress)
                    : (order.shippingAddress || {});
            }
            catch (e) {
                billingAddress = {};
            }
            const buyerGST = order.gstNumber || ((_a = order.user) === null || _a === void 0 ? void 0 : _a.gstNumber);
            doc.font('Helvetica-Bold').text('Billing Address :', rightColX, rightY, { width: rightColWidth, align: 'right' });
            rightY += 15;
            doc.font('Helvetica').text(billingAddress.name || billingAddress.fullName || 'N/A', rightColX, rightY, { width: rightColWidth, align: 'right' });
            rightY += 15;
            doc.text(billingAddress.line1 || billingAddress.addressLine1 || '', rightColX, rightY, { width: rightColWidth, align: 'right' });
            rightY += 15;
            doc.text(`${billingAddress.city || ''}, ${billingAddress.state || ''} ${billingAddress.pincode || billingAddress.postalCode || ''}`, rightColX, rightY, { width: rightColWidth, align: 'right' });
            if (buyerGST) {
                rightY += 15;
                doc.font('Helvetica-Bold').text(`GSTIN: ${buyerGST}`, rightColX, rightY, { width: rightColWidth, align: 'right' });
            }
            rightY += 30;
            doc.font('Helvetica-Bold').text('Shipping Address :', rightColX, rightY, { width: rightColWidth, align: 'right' });
            rightY += 15;
            doc.font('Helvetica').text(billingAddress.name || billingAddress.fullName || 'N/A', rightColX, rightY, { width: rightColWidth, align: 'right' });
            rightY += 15;
            doc.text(billingAddress.line1 || billingAddress.addressLine1 || '', rightColX, rightY, { width: rightColWidth, align: 'right' });
            rightY += 15;
            doc.text(`${billingAddress.city || ''}, ${billingAddress.state || ''} ${billingAddress.pincode || billingAddress.postalCode || ''}`, rightColX, rightY, { width: rightColWidth, align: 'right' });
            const midSectionY = 320;
            doc.rect(margin, midSectionY - 10, contentWidth, 65).fillOpacity(0.05).fill('#000').strokeOpacity(0.0).stroke();
            doc.fillOpacity(1).fillColor('black');
            doc.font('Helvetica-Bold').text('Order No:', margin + 10, midSectionY);
            doc.font('Helvetica').text(order.customId || order.id.toString(), margin + 70, midSectionY);
            doc.font('Helvetica-Bold').text('Order Date:', margin + 10, midSectionY + 20);
            doc.font('Helvetica').text(order.createdAt.toLocaleDateString('en-IN'), margin + 70, midSectionY + 20);
            const payment = (_b = order.payments) === null || _b === void 0 ? void 0 : _b[0];
            let paymentMode = 'Pending';
            if (payment) {
                paymentMode = payment.provider === 'COD' ? 'Cash on Delivery' : 'Online (Prepaid)';
            }
            else {
                paymentMode = 'Online (Prepaid)';
            }
            doc.font('Helvetica-Bold').text('Payment Mode:', margin + 10, midSectionY + 40);
            doc.font('Helvetica').text(paymentMode, margin + 90, midSectionY + 40);
            const invoiceX = centerX;
            doc.font('Helvetica-Bold').text('Invoice No:', invoiceX, midSectionY);
            doc.font('Helvetica').text(invoiceNo, invoiceX + 65, midSectionY);
            doc.font('Helvetica-Bold').text('Invoice Date:', invoiceX, midSectionY + 20);
            doc.font('Helvetica').text(invoiceDate, invoiceX + 65, midSectionY + 20);
            try {
                const qrPng = qr.imageSync(JSON.stringify({
                    invoice: invoiceNo,
                    total: Number(order.total)
                }), { type: 'png' });
                doc.image(qrPng, pageWidth - margin - 50, midSectionY - 5, { width: 40 });
            }
            catch (e) {
                console.log('QR Gen Error:', e);
            }
            doc.fontSize(8).text('Dynamic QR Code', pageWidth - margin - 60, midSectionY + 40, { width: 60, align: 'center' });
            const tableTop = 400;
            const xSl = margin + 5;
            const xDesc = margin + 40;
            const xHsn = margin + 200;
            const xUnit = margin + 250;
            const xQty = margin + 315;
            const xNet = margin + 345;
            const xTax = margin + 415;
            const xTotal = margin + 485;
            doc.rect(margin, tableTop, contentWidth, 25).fill('#333333').stroke();
            doc.fillColor('white').font('Helvetica-Bold').fontSize(9);
            doc.text('SI', xSl, tableTop + 8);
            doc.text('Description', xDesc, tableTop + 8);
            doc.text('HSN', xHsn, tableTop + 8);
            doc.text('Unit Price', xUnit, tableTop + 8);
            doc.text('Qty', xQty, tableTop + 8);
            doc.text('Net', xNet, tableTop + 8);
            doc.text('Tax', xTax, tableTop + 8);
            doc.text('Total', xTotal, tableTop + 8);
            doc.fillColor('black');
            let rowY = tableTop + 25;
            let i = 1;
            let subTotalSum = 0;
            let totalTaxSum = 0;
            order.items.forEach((item) => {
                var _a, _b;
                const price = Number(item.price);
                const taxRate = 18;
                const taxAmount = (price * item.quantity * taxRate) / 100;
                const netAmount = price * item.quantity;
                const total = netAmount + taxAmount;
                const hsn = ((_b = (_a = item.variant) === null || _a === void 0 ? void 0 : _a.product) === null || _b === void 0 ? void 0 : _b.hsnSac) || '-';
                subTotalSum += netAmount;
                totalTaxSum += taxAmount;
                doc.rect(margin, rowY, contentWidth, 35).strokeColor('#dddddd').stroke();
                doc.font('Helvetica').fontSize(9).text(i.toString(), xSl, rowY + 10);
                doc.text(item.title.substring(0, 35), xDesc, rowY + 10, { width: 160 });
                doc.text(hsn, xHsn, rowY + 10);
                doc.text(price.toFixed(2), xUnit, rowY + 10);
                doc.text(item.quantity.toString(), xQty, rowY + 10);
                doc.text(netAmount.toFixed(2), xNet, rowY + 10);
                doc.text(`${(taxAmount).toFixed(2)}`, xTax, rowY + 10);
                doc.font('Helvetica-Bold').text(total.toFixed(2), xTotal, rowY + 10);
                rowY += 35;
                i++;
            });
            const totalsY = rowY + 10;
            const totalsWidth = 200;
            const totalsX = pageWidth - margin - totalsWidth;
            const sellerState = 'Gujarat';
            const buyerState = billingAddress.state || '';
            const isIntraState = buyerState.toLowerCase() === sellerState.toLowerCase();
            const totalsBoxHeight = isIntraState ? 120 : 100;
            doc.rect(totalsX - 10, totalsY, totalsWidth + 10, totalsBoxHeight).fillOpacity(0.05).fill('#000');
            doc.fillOpacity(1);
            let curY = totalsY + 10;
            doc.fontSize(10);
            doc.font('Helvetica').text('Subtotal:', totalsX, curY);
            doc.text(subTotalSum.toFixed(2), totalsX + 100, curY, { align: 'right', width: 90 });
            curY += 20;
            if (isIntraState) {
                const halfTax = totalTaxSum / 2;
                doc.text('CGST (9%):', totalsX, curY);
                doc.text(halfTax.toFixed(2), totalsX + 100, curY, { align: 'right', width: 90 });
                curY += 20;
                doc.text('SGST (9%):', totalsX, curY);
                doc.text(halfTax.toFixed(2), totalsX + 100, curY, { align: 'right', width: 90 });
                curY += 20;
            }
            else {
                doc.text('IGST (18%):', totalsX, curY);
                doc.text(totalTaxSum.toFixed(2), totalsX + 100, curY, { align: 'right', width: 90 });
                curY += 20;
            }
            const itemsTotal = subTotalSum + totalTaxSum;
            const orderTotal = Number(order.total);
            let shippingCharge = orderTotal - itemsTotal;
            if (shippingCharge < 0)
                shippingCharge = 0;
            doc.text('Shipping:', totalsX, curY);
            doc.text(shippingCharge.toFixed(2), totalsX + 100, curY, { align: 'right', width: 90 });
            curY += 25;
            doc.moveTo(totalsX, curY - 5).lineTo(pageWidth - margin, curY - 5).strokeColor('#000').stroke();
            doc.font('Helvetica-Bold').fontSize(12).text('Grand Total:', totalsX, curY);
            doc.text(`Rs. ${orderTotal.toFixed(2)}`, totalsX + 100, curY, { align: 'right', width: 90 });
            const bottomY = totalsY + totalsBoxHeight + 20;
            doc.font('Helvetica-Bold').fontSize(10).text('Amount in Words:', margin, bottomY);
            doc.font('Helvetica').text(`Rupees ${Number(order.total).toFixed(2)} Only`, margin, bottomY + 15);
            const sigY = bottomY;
            const sigX = pageWidth - margin - 200;
            doc.font('Helvetica-Bold').text('For AxarTechWave:', sigX, sigY, { align: 'right', width: 200 });
            const sigPath = path.join(process.cwd(), '../images/signature.jpeg');
            if (fs.existsSync(sigPath)) {
                try {
                    doc.image(sigPath, sigX + 100, sigY + 25, { width: 100 });
                }
                catch (e) {
                    console.error('Signature Error:', e.message);
                }
            }
            doc.text('Authorized Signatory', sigX, sigY + 85, { align: 'right', width: 200 });
            doc.end();
        });
    }
};
exports.InvoicesService = InvoicesService;
exports.InvoicesService = InvoicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InvoicesService);
//# sourceMappingURL=invoices.service.js.map