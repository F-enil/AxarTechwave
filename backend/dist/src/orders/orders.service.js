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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const cart_service_1 = require("../cart/cart.service");
const media_service_1 = require("../media/media.service");
const notification_service_1 = require("../notifications/notification.service");
const invoices_service_1 = require("./invoices.service");
const tax_service_1 = require("./tax.service");
const order_id_service_1 = require("./order-id.service");
let OrdersService = class OrdersService {
    constructor(prisma, cartService, mediaService, notificationService, taxService, orderIdService, invoiceService) {
        this.prisma = prisma;
        this.cartService = cartService;
        this.mediaService = mediaService;
        this.notificationService = notificationService;
        this.taxService = taxService;
        this.orderIdService = orderIdService;
        this.invoiceService = invoiceService;
    }
    async createOrder(userId, shippingAddress, gstNumber, paymentMethod) {
        const cart = await this.cartService.getCart(userId);
        if (!cart.items || cart.items.length === 0) {
            throw new Error('Cart is empty');
        }
        const order = await this.prisma.$transaction(async (tx) => {
            var _a;
            let total = 0;
            let totalTax = 0;
            let totalCGST = 0;
            let totalSGST = 0;
            let totalIGST = 0;
            const orderItems = [];
            const shippingState = (shippingAddress === null || shippingAddress === void 0 ? void 0 : shippingAddress.state) || '';
            for (const item of cart.items) {
                const totalIn = await tx.inventoryLedger.aggregate({
                    where: { variantId: item.variantId, type: 'in' },
                    _sum: { quantity: true }
                }).then(res => { var _a; return ((_a = res._sum) === null || _a === void 0 ? void 0 : _a.quantity) || 0; });
                const totalOut = await tx.inventoryLedger.aggregate({
                    where: { variantId: item.variantId, type: 'out' },
                    _sum: { quantity: true }
                }).then(res => { var _a; return ((_a = res._sum) === null || _a === void 0 ? void 0 : _a.quantity) || 0; });
                const currentStock = totalIn - totalOut;
                if (currentStock < item.quantity) {
                    throw new Error(`Insufficient stock for product: ${item.variant.product.title}. Available: ${currentStock}, Requested: ${item.quantity}`);
                }
                const price = Number(((_a = item.variant.prices[0]) === null || _a === void 0 ? void 0 : _a.basePrice) || 0);
                const taxRate = item.variant.product.taxRate || 18;
                const rates = {
                    cgst: item.variant.product.cgst || 0,
                    sgst: item.variant.product.sgst || 0,
                    igst: item.variant.product.igst || 0
                };
                const itemTax = this.taxService.calculateItemTax(price, item.quantity, shippingState, rates);
                total += itemTax.taxableAmount;
                totalTax += itemTax.totalTax;
                totalCGST += itemTax.cgst;
                totalSGST += itemTax.sgst;
                totalIGST += itemTax.igst;
                orderItems.push({
                    variantId: item.variantId,
                    quantity: item.quantity,
                    price: price,
                    title: item.variant.product.title,
                    sku: item.variant.sku,
                });
                await tx.inventoryLedger.create({
                    data: {
                        variantId: item.variantId,
                        quantity: item.quantity,
                        type: 'out',
                        reference: 'order_payment_pending'
                    }
                });
                const newStock = currentStock - item.quantity;
                this.notificationService.checkStockLevel(item.variantId, item.variant.product.title, newStock);
            }
            const shippingCost = 50;
            const finalTotal = total + totalTax + shippingCost;
            const taxDetails = {
                totalTax: Number(totalTax.toFixed(2)),
                cgst: Number(totalCGST.toFixed(2)),
                sgst: Number(totalSGST.toFixed(2)),
                igst: Number(totalIGST.toFixed(2))
            };
            const customId = this.orderIdService.generateOrderId();
            console.log('[CreateOrder] Generated Custom ID:', customId);
            const newOrder = await tx.order.create({
                data: {
                    userId,
                    customId,
                    status: 'created',
                    total: finalTotal,
                    discount: 0,
                    currency: 'INR',
                    shippingAddress: shippingAddress || {},
                    gstNumber,
                    taxDetails: taxDetails || {},
                    items: {
                        create: orderItems,
                    },
                },
                include: { items: true },
            });
            if (paymentMethod === 'cod') {
                await tx.payment.create({
                    data: {
                        orderId: newOrder.id,
                        provider: 'COD',
                        amount: finalTotal,
                        currency: 'INR',
                        status: 'pending',
                        transactionId: `COD-${customId}`
                    }
                });
            }
            await tx.cartItem.deleteMany({
                where: { cartId: cart.id },
            });
            return newOrder;
        });
        return order;
    }
    async getOrders(userId) {
        const orders = await this.prisma.order.findMany({
            where: { userId },
            include: {
                items: {
                    include: {
                        variant: {
                            include: {
                                product: true
                            }
                        }
                    }
                },
                payments: true
            },
            orderBy: { createdAt: 'desc' },
        });
        await this.processOrderImages(orders);
        return orders;
    }
    async findAllOrders() {
        const orders = await this.prisma.order.findMany({
            include: {
                items: {
                    include: {
                        variant: {
                            include: {
                                product: true
                            }
                        }
                    }
                },
                user: {
                    select: { email: true, username: true }
                },
                payments: true,
                invoices: true
            },
            orderBy: { createdAt: 'desc' },
        });
        await this.processOrderImages(orders);
        return orders;
    }
    async getOrderById(id, userId) {
        const where = { id };
        if (userId) {
            where.userId = userId;
        }
        const order = await this.prisma.order.findUnique({
            where: where,
            include: {
                items: {
                    include: {
                        variant: {
                            include: {
                                product: true
                            }
                        }
                    }
                },
                user: { select: { email: true, username: true } },
                invoices: true,
                payments: true
            }
        });
        if (userId && order && order.userId !== userId) {
            return null;
        }
        if (order) {
            await this.processOrderImages([order]);
        }
        return order;
    }
    async exportOrders() {
        const orders = await this.findAllOrders();
        const header = [
            'Order ID',
            'Custom ID',
            'Date',
            'Status',
            'User Name',
            'User Email',
            'Shipping Name',
            'Address Line 1',
            'City',
            'State',
            'Pincode',
            'Country',
            'Phone',
            'Payment Method',
            'Transaction ID',
            'GST Number',
            'Total Amount',
            'Tax Amount',
            'Courier',
            'Tracking ID',
            'Order Items',
            'HSN Codes',
            'Invoice No'
        ];
        const rows = orders.map(o => {
            var _a, _b;
            let addr = {};
            try {
                addr = typeof o.shippingAddress === 'string'
                    ? JSON.parse(o.shippingAddress)
                    : (o.shippingAddress || {});
            }
            catch (e) {
                addr = {};
            }
            const payment = o.payments && o.payments.length > 0 ? o.payments[0] : null;
            const tax = o.taxDetails ? (o.taxDetails.totalTax || 0) : 0;
            const col0_id = o.id;
            const col1_customId = o.customId || '';
            const col2_date = o.createdAt ? o.createdAt.toISOString() : '';
            const col3_status = o.status;
            const col4_username = ((_a = o.user) === null || _a === void 0 ? void 0 : _a.username) || 'Guest';
            const col5_email = ((_b = o.user) === null || _b === void 0 ? void 0 : _b.email) || '';
            const col6_shipName = addr.fullName || addr.name || `${addr.firstName || ''} ${addr.lastName || ''}`.trim();
            const col7_addr1 = addr.addressLine1 || addr.line1 || addr.address || '';
            const col8_city = addr.city || '';
            const col9_state = addr.state || '';
            const col10_zip = addr.postalCode || addr.pincode || addr.zip || '';
            const col11_country = addr.country || 'India';
            const col12_phone = addr.phone || '';
            const col13_paymentMethod = payment ? payment.provider : 'N/A';
            const col14_txnId = payment ? payment.transactionId : 'N/A';
            const col15_gst = o.gstNumber || '';
            const col16_total = o.total;
            const col17_tax = tax;
            const col18_courier = o.courierCompanyName || '';
            const col19_tracking = o.trackingId || '';
            const col20_items = o.items.map(i => {
                const title = i.title ? i.title.replace(/,/g, ' ') : 'Item';
                return `${title} (x${i.quantity})`;
            }).join('; ');
            const col21_hsn = o.items.map(i => { var _a, _b; return ((_b = (_a = i.variant) === null || _a === void 0 ? void 0 : _a.product) === null || _b === void 0 ? void 0 : _b.hsnSac) || 'N/A'; }).join('; ');
            const col22_invoice = o.invoices && o.invoices.length > 0 ? o.invoices[0].invoiceNo : 'N/A';
            return [
                col0_id,
                col1_customId,
                col2_date,
                col3_status,
                col4_username,
                col5_email,
                col6_shipName,
                col7_addr1,
                col8_city,
                col9_state,
                col10_zip,
                col11_country,
                col12_phone,
                col13_paymentMethod,
                col14_txnId,
                col15_gst,
                col16_total,
                col17_tax,
                col18_courier,
                col19_tracking,
                col20_items,
                col21_hsn,
                col22_invoice
            ];
        });
        return this.generateCsv(header, rows);
    }
    generateCsv(header, rows) {
        return [
            header.join(','),
            ...rows.map(row => row.map(field => {
                const str = String(field !== null && field !== undefined ? field : '');
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            }).join(','))
        ].join('\n');
    }
    async verifyPayment(orderId, paymentId, signature) {
        await this.prisma.order.update({
            where: { id: orderId },
            data: { status: 'paid' }
        });
        await this.prisma.payment.create({
            data: {
                orderId,
                amount: 0,
                currency: 'INR',
                provider: 'razorpay',
                transactionId: paymentId,
                status: 'success'
            }
        });
        try {
            await this.invoiceService.generateInvoice(orderId);
        }
        catch (e) {
            console.error('Failed to auto-generate invoice record:', e);
        }
        return { success: true };
    }
    async updateStatus(id, status) {
        return this.prisma.order.update({
            where: { id },
            data: { status }
        });
    }
    async updateTracking(id, trackingId, courierCompanyName, status) {
        const data = {
            trackingId,
            courierCompanyName
        };
        if (status) {
            data.status = status;
        }
        else {
            data.status = 'shipped';
        }
        return this.prisma.order.update({
            where: { id },
            data
        });
    }
    async processOrderImages(orders) {
        const productIds = new Set();
        orders.forEach(order => {
            if (order.items) {
                order.items.forEach(item => {
                    var _a;
                    if ((_a = item.variant) === null || _a === void 0 ? void 0 : _a.productId) {
                        productIds.add(item.variant.productId);
                    }
                });
            }
        });
        if (productIds.size === 0)
            return;
        const mediaItems = await this.prisma.media.findMany({
            where: {
                ownerType: 'product',
                ownerId: { in: Array.from(productIds) }
            }
        });
        const mediaWithUrls = await Promise.all(mediaItems.map(async (m) => (Object.assign(Object.assign({}, m), { url: await this.mediaService.getPresignedUrl(m.s3Key) }))));
        orders.forEach(order => {
            if (order.items) {
                order.items.forEach(item => {
                    var _a;
                    if ((_a = item.variant) === null || _a === void 0 ? void 0 : _a.product) {
                        item.variant.product.media = mediaWithUrls.filter(m => m.ownerId === item.variant.productId);
                    }
                });
            }
        });
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cart_service_1.CartService,
        media_service_1.MediaService,
        notification_service_1.NotificationService,
        tax_service_1.TaxService,
        order_id_service_1.OrderIdService,
        invoices_service_1.InvoicesService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map