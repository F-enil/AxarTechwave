import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as qr from 'qr-image';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class InvoiceService {

    
    async generateInvoice(order: any, stream: any) {
        const doc = new PDFDocument({ margin: 50 });
        doc.pipe(stream);

        // Define fonts/colors
        const primaryColor = '#003040';

        // 1. Header
        // Logo
        const logoPath = path.join(process.cwd(), '../images/logo.png'); // Assuming backend is in /backend and images in /images
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 50, 45, { width: 50 });
        }

        doc
            .fillColor(primaryColor)
            .fontSize(20)
            .text('INVOICE', 50, 57, { align: 'right' })
            .fontSize(10)
            .text(`Invoice Number: ${order.invoices?.[0]?.invoiceNo || order.customId || order.id}`, { align: 'right' })
            .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, { align: 'right' })
            .text(`Order ID: ${order.customId || order.id}`, { align: 'right' });

        doc.moveDown();

        // 2. Bill To / Ship To
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
            .text(shipping.name || order.user?.username || 'Guest', 300, 145)
            .font('Helvetica')
            .text(shipping.line1 || '', 300, 160)
            .text(`${shipping.city || ''}, ${shipping.state || ''} ${shipping.pincode || ''}`, 300, 175)
            .text(`GSTIN: ${order.gstNumber || 'N/A'}`, 300, 190);

        doc.moveDown();

        // 3. Table Header
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

        // 4. Items
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

        // 5. Totals
        y += 20;
        const tax = order.taxDetails || { totalTax: 0, cgst: 0, sgst: 0, igst: 0 };
        const shippingCost = 50; // Hardcoded as per req

        // Ensure accurate totals from Order object if possible, else fallback to calculation
        // Usually order.total is the final amount.

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
        } else if (tax.igst > 0) {
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

        // 6. QR Code
        const qrSvg = qr.imageSync(`Payment Ref: ${order.customId} | Amount: ${order.total}`, { type: 'png' });
        doc.image(qrSvg, 50, 650, { width: 100 });
        doc.fontSize(10).text('Scan for Order Details', 50, 760);

        doc.end();
    }
}
