import { Controller, Post, Get, UseGuards, Request, Body, Res, Param, ParseIntPipe, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { OrdersService } from './orders.service';
import { InvoicesService } from './invoices.service';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../auth/admin.guard';

@Controller('orders')
@UseGuards(AuthGuard('jwt'))
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
        console.log('!!! CONTROLLER REACHED - EXPORT ENDPOINT !!!');
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
}
