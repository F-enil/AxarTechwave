import { Controller, Post, Get, UseGuards, Request, Body, Res, Param, ParseIntPipe, UnauthorizedException, Headers, BadRequestException } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator'; // Assuming you have a public decorator or need to exclude from global guard
import { Response } from 'express';
import { OrdersService } from './orders.service';
import { InvoicesService } from './invoices.service';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
    constructor(
        private readonly ordersService: OrdersService,
        private readonly invoiceService: InvoicesService
    ) { }

    @Post()
    createOrder(@Request() req, @Body() body: { shippingAddress: any, gstNumber?: string, paymentMethod?: string }) {
        return this.ordersService.createOrder(req.user.userId, body.shippingAddress, body.gstNumber, body.paymentMethod);
    }

    @Get()
    getOrders(@Request() req) {
        return this.ordersService.getOrders(req.user.userId);
    }

    @UseGuards(AdminGuard)
    @Get('admin/all')
    getAllOrders() {
        return this.ordersService.findAllOrders();
    }

    @UseGuards(AdminGuard)
    @Get('admin/download-csv-v3')
    async exportOrders(@Res() res: Response) {

        const csv = await this.ordersService.exportOrders();
        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', 'attachment; filename="orders_v2.csv"');
        res.send(csv);
    }

    @UseGuards(AdminGuard)
    @Get('admin/:id')
    async getOrderByIdAdmin(@Param('id', ParseIntPipe) id: number) {
        return this.ordersService.getOrderById(id);
    }

    @Get(':id/invoice')
    async getInvoice(@Param('id', ParseIntPipe) id: number, @Request() req, @Res() res: Response) {
        // Security Check: Ensure User owns the order (or is Admin)
        if (req.user.role !== 'admin') {
            const order = await this.ordersService.getOrderById(id, req.user.userId);
            if (!order) {
                // If order exists but belongs to diff user, getOrderById returns null (due to logic added)
                // If order invalid, returns null
                throw new UnauthorizedException('You do not have permission to view this invoice');
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
        } catch (e) {
            console.error(e);
            res.status(500).send('Error generating invoice');
        }
    }

    @Post(':id/verify-payment')
    verifyPayment(@Param('id', ParseIntPipe) id: number, @Body() body: { paymentId: string, signature: string }) {
        return this.ordersService.verifyPayment(id, body.paymentId, body.signature);
    }

    @UseGuards(AdminGuard)
    @Post(':id/status')
    updateStatus(@Param('id', ParseIntPipe) id: number, @Body() body: { status: string }) {
        return this.ordersService.updateStatus(id, body.status);
    }

    @UseGuards(AdminGuard)
    @Post(':id/tracking')
    updateTracking(@Param('id', ParseIntPipe) id: number, @Body() body: { trackingId: string, courierCompanyName: string, status?: string }) {
        return this.ordersService.updateTracking(id, body.trackingId, body.courierCompanyName, body.status);
    }

    @Public() // Bypass JWT Auth
    @Post('webhook')
    async handleWebhook(@Headers('x-razorpay-signature') signature: string, @Body() body: any) {
        // 1. Verify Secret Exists
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.error('Webhook Secret Missing in Environment');
            throw new BadRequestException('Server Config Error');
        }

        // 2. Verify Signature
        const crypto = require('crypto');
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(JSON.stringify(body))
            .digest('hex');

        if (expectedSignature !== signature) {
            console.error('Invalid Webhook Signature');
            throw new BadRequestException('Invalid Signature');
        }

        // 3. Handle Events
        const event = body.event;
        console.log(`[Webhook] Received Event: ${event}`);

        if (event === 'payment.captured' || event === 'order.paid') {
            const payment = body.payload.payment.entity;
            const orderCustomId = payment.description.replace('Order #', '').trim(); // Extract ID

            // We need to find order by Custom ID or DB ID
            // Since we stored customId, we might need a lookup method
            // Or if description is purely the ID

            console.log(`[Webhook] Payment Captured for Order ${orderCustomId}`);

            // Ideally calls a service method to update status by CustomID
            await this.ordersService.handleWebhookPayment(orderCustomId, payment.id, payment.amount);
        }

        return { status: 'ok' };
    }
}
