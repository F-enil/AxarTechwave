import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { MediaService } from '../media/media.service';
import { NotificationService } from '../notifications/notification.service';
import { InvoicesService } from './invoices.service';
import { TaxService } from './tax.service';
import { OrderIdService } from './order-id.service';

@Injectable()
export class OrdersService {
    constructor(
        private prisma: PrismaService,
        private cartService: CartService,
        private mediaService: MediaService,
        private notificationService: NotificationService,
        private taxService: TaxService,
        private orderIdService: OrderIdService,
        private invoiceService: InvoicesService
    ) { }

    async createOrder(userId: number, shippingAddress: any, gstNumber?: string, paymentMethod?: string) {
        // 1. Get Cart
        const cart: any = await this.cartService.getCart(userId);
        if (!cart.items || cart.items.length === 0) {
            throw new Error('Cart is empty');
        }

        // 2. Return Transaction Result
        const order = await this.prisma.$transaction(async (tx) => {
            let total = 0;
            let totalTax = 0;
            let totalCGST = 0;
            let totalSGST = 0;
            let totalIGST = 0;

            const orderItems = [];
            const shippingState = shippingAddress?.state || '';

            for (const item of cart.items) {
                // A. Check Stock
                const totalIn = await tx.inventoryLedger.aggregate({
                    where: { variantId: item.variantId, type: 'in' },
                    _sum: { quantity: true }
                }).then(res => res._sum?.quantity || 0);

                const totalOut = await tx.inventoryLedger.aggregate({
                    where: { variantId: item.variantId, type: 'out' },
                    _sum: { quantity: true }
                }).then(res => res._sum?.quantity || 0);

                const currentStock = totalIn - totalOut;

                if (currentStock < item.quantity) {
                    throw new Error(`Insufficient stock for product: ${item.variant.product.title}. Available: ${currentStock}, Requested: ${item.quantity}`);
                }

                // B. Prepare Order Item & Calculate Tax
                const price = Number(item.variant.prices[0]?.basePrice || 0);
                const taxRate = item.variant.product.taxRate || 18;
                const rates = {
                    cgst: item.variant.product.cgst || 0,
                    sgst: item.variant.product.sgst || 0,
                    igst: item.variant.product.igst || 0
                };

                // Calculate tax for this item
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
                    // Store tax info per item if needed in future, for now aggregate
                });

                // C. Stock Check Only (Deduction deferred to Payment)
                // Note: We already checked (currentStock < item.quantity) above.
                // We DO NOT deduct stock here anymore. It happens on payment success.

                // D. Low Stock Notification
                // Check theoretical new stock (just to warn if low), but don't notify yet until sold?
                // Actually, let's keep notification here or move it? 
                // Let's keep notification strict: notify only when actually sold.
                // Removing notification from here.
            }

            // Create Order
            const shippingCost = 50;
            const finalTotal = total + totalTax + shippingCost;

            const taxDetails = {
                totalTax: Number(totalTax.toFixed(2)),
                cgst: Number(totalCGST.toFixed(2)),
                sgst: Number(totalSGST.toFixed(2)),
                igst: Number(totalIGST.toFixed(2))
            };

            const customId = this.orderIdService.generateOrderId();
            console.log('[CreateOrder] Generated Custom ID:', customId); // DEBUG LOG


            const newOrder = await tx.order.create({
                data: {
                    userId,
                    customId,
                    status: (paymentMethod === 'cod') ? 'processing' : 'created',
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

            // Handle COD Payment Record
            if (paymentMethod === 'cod') {
                await tx.payment.create({
                    data: {
                        orderId: newOrder.id,
                        provider: 'COD',
                        amount: finalTotal,
                        currency: 'INR',
                        status: 'pending', // COD is pending until delivery
                        transactionId: `COD-${customId}`
                    }
                });

                // For COD, we deduct stock immediately
                for (const item of cart.items) {
                    await tx.inventoryLedger.create({
                        data: {
                            variantId: item.variantId,
                            quantity: item.quantity,
                            type: 'out',
                            reference: `order_cod_${newOrder.customId}`
                        }
                    });
                    // NOTE: We moved the "Low Stock Notification" logic OUTSIDE the transaction loop 
                    // to prevent slow external calls from crashing the transaction (Timeout Error).
                }
            }

            // Clear Cart
            await tx.cartItem.deleteMany({
                where: { cartId: cart.id },
            });

            return newOrder;
        }, {
            maxWait: 5000, // default: 2000
            timeout: 10000 // default: 5000 // INCREASED to prevent timeout errors
        });

        // POST-TRANSACTION: Handle Side Effects (Notifications)
        // This runs AFTER the order is safely committed to DB.
        if (paymentMethod === 'cod') {
            // We need to re-fetch items or use the cart items we assume were deducted
            // To be accurate, let's just use the cart items loop again (it's safe here outside tx)
            for (const item of cart.items) {
                this.checkStock(item.variantId, item.variant.product.title);
            }
        }

        return order;
    }

    // Helper to check stock async without blocking
    async checkStock(variantId: number, productTitle: string) {
        try { // Safe check
            const totalIn = await this.prisma.inventoryLedger.aggregate({ where: { variantId: variantId, type: 'in' }, _sum: { quantity: true } }).then(res => res._sum?.quantity || 0);
            const totalOut = await this.prisma.inventoryLedger.aggregate({ where: { variantId: variantId, type: 'out' }, _sum: { quantity: true } }).then(res => res._sum?.quantity || 0);
            this.notificationService.checkStockLevel(variantId, productTitle, totalIn - totalOut);
        } catch (e) {
            console.error('Failed to run background stock check', e);
        }
    }

    async getOrders(userId: number) {
        const orders: any = await this.prisma.order.findMany({
            where: {
                userId,
                status: { not: 'created' } // Hide ghost orders
            },
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
        const orders: any = await this.prisma.order.findMany({
            where: { status: { not: 'created' } }, // Hide ghost orders
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
                payments: true, // Include payments for Export/Admin
                invoices: true // Include invoices for Export
            },
            orderBy: { createdAt: 'desc' },
        });

        await this.processOrderImages(orders);
        return orders;
    }

    async getOrderById(id: number, userId?: number) {
        const where: any = { id };
        if (userId) {
            where.userId = userId;
        }

        const order: any = await this.prisma.order.findUnique({
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

        // Strict RLS: If query logic strictly needs findFirst for non-unique where
        // Prisma findUnique only accepts unique identifiers.
        // If combining id + userId, we must use findFirst or ensure compound unique.
        // Assuming id is PK (unique).
        // if userId is passed, we check if order.userId === userId.

        if (userId && order && order.userId !== userId) {
            return null; // Or throw Forbidden
        }

        if (order) {
            await this.processOrderImages([order]);
        }
        return order;
    }

    async exportOrders() {
        // console.log("!!! EXPORTING ORDERS - DEBUG V3 - EXPLICIT COLUMN MAPPING !!!");
        const orders: any = await this.findAllOrders();

        // Define Headers
        const header = [
            'Order ID',         // 0
            'Custom ID',        // 1
            'Date',             // 2
            'Status',           // 3
            'User Name',        // 4
            'User Email',       // 5
            'Shipping Name',    // 6
            'Address Line 1',   // 7
            'City',             // 8
            'State',            // 9
            'Pincode',          // 10
            'Country',          // 11
            'Phone',            // 12
            'Payment Method',   // 13
            'Transaction ID',   // 14
            'GST Number',       // 15
            'Total Amount',     // 16
            'Tax Amount',       // 17
            'Courier',          // 18
            'Tracking ID',      // 19
            'Order Items',      // 20
            'HSN Codes',        // 21
            'Invoice No'        // 22
        ];

        const rows = orders.map(o => {
            // 1. Address Parsing
            let addr: any = {};
            try {
                addr = typeof o.shippingAddress === 'string'
                    ? JSON.parse(o.shippingAddress)
                    : (o.shippingAddress || {});
            } catch (e) {
                addr = {};
            }

            // 2. Payment Info
            const payment = o.payments && o.payments.length > 0 ? o.payments[0] : null;

            // 3. Tax & Items
            const tax = o.taxDetails ? (o.taxDetails.totalTax || 0) : 0;

            // Explicitly map each field to avoid any index confusion
            const col0_id = o.id;
            const col1_customId = o.customId || '';
            const col2_date = o.createdAt ? o.createdAt.toISOString() : '';
            const col3_status = o.status;
            const col4_username = o.user?.username || 'Guest';
            const col5_email = o.user?.email || '';
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
            const col19_tracking = o.trackingId || ''; // This was potentially leaking into Items?

            // Format Items Strictly
            const col20_items = o.items.map(i => {
                const title = i.title ? i.title.replace(/,/g, ' ') : 'Item'; // Remove commas to be safe
                return `${title} (x${i.quantity})`;
            }).join('; ');

            const col21_hsn = o.items.map(i => i.variant?.product?.hsnSac || 'N/A').join('; ');
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

    private generateCsv(header: string[], rows: any[][]): string {
        return [
            header.join(','),
            ...rows.map(row => row.map(field => {
                // Robust CSV escaping
                const str = String(field !== null && field !== undefined ? field : '');
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            }).join(','))
        ].join('\n');
    }

    async verifyPayment(orderId: number, paymentId: string, signature: string) {
        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret) throw new Error('Razorpay Secret is missing in backend (.env)');

        // Verify Signature
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const crypto = require('crypto');
        const generated_signature = crypto
            .createHmac('sha256', secret)
            .update(orderId + "|" + paymentId)
            .digest('hex');

        if (generated_signature !== signature) {
            throw new Error('Payment verification failed: Invalid Signature');
        }

        console.log(`[Payment] Verified Order #${orderId} with Payment ID ${paymentId}`);

        // Update Order Status to 'paid'
        // Also update 'paidAt' if schema supports it

        await this.prisma.order.update({
            where: { id: orderId },
            data: { status: 'paid' }
        });

        // Record payment
        await this.prisma.payment.create({
            data: {
                orderId,
                amount: 0, // Should fetch from order
                currency: 'INR',
                provider: 'razorpay',
                transactionId: paymentId,
                status: 'success'
            }
        });

        // Auto-generate invoice record on payment success
        try {
            await this.invoiceService.generateInvoice(orderId);
        } catch (e) {
            console.error('Failed to auto-generate invoice record:', e);
        }

        // Deduct Stock on Payment Success
        // We need to fetch the order items first
        const paidOrder = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: { include: { variant: { include: { product: true } } } } }
        });

        if (paidOrder && paidOrder.items) {
            for (const item of paidOrder.items) {
                // Deduct Stock
                await this.prisma.inventoryLedger.create({
                    data: {
                        variantId: item.variantId,
                        quantity: item.quantity,
                        type: 'out',
                        reference: `order_paid_${paidOrder.customId}`
                    }
                });

                // Check Low Stock
                // (Optimized: Fire and forget check)
                this.checkStockAfterDeduction(item.variantId, item.variant?.product?.title || 'Product');
            }
        }

        return { success: true };
    }

    async updateStatus(id: number, status: string) {
        return this.prisma.order.update({
            where: { id },
            data: { status }
        });
    }

    async handleWebhookPayment(customIdOrId: string, paymentId: string, amount: number) {
        // Try to find order by Custom ID first, then ID
        // Note: Prisma findFirst needed if customId is not unique constraint, 
        // but it should be unique enough for this logic.

        let order = await this.prisma.order.findFirst({
            where: { OR: [{ customId: customIdOrId }, { id: Number(customIdOrId) || 0 }] }
        });

        if (!order) {
            console.error(`[Webhook] Order Not Found: ${customIdOrId}`);
            return;
        }

        if (order.status === 'paid') {
            console.log(`[Webhook] Order ${order.id} already paid. Skipping.`);
            return;
        }

        console.log(`[Webhook] Marking Order ${order.id} as PAID`);

        await this.prisma.$transaction([
            this.prisma.order.update({
                where: { id: order.id },
                data: { status: 'paid' }
            }),
            this.prisma.payment.create({
                data: {
                    orderId: order.id,
                    amount: amount / 100, // Razorpay sends paise
                    currency: 'INR',
                    provider: 'razorpay_webhook',
                    transactionId: paymentId,
                    status: 'success'
                }
            })
        ]);

        // Generate Invoice
        try {
            await this.invoiceService.generateInvoice(order.id);
        } catch (e) {
            console.error('Failed to auto-generate invoice record:', e);
        }

        // Deduct Stock on Webhook Payment Success
        if (order && order.id) {
            const paidOrder = await this.prisma.order.findUnique({
                where: { id: order.id },
                include: { items: { include: { variant: { include: { product: true } } } } }
            });

            if (paidOrder && paidOrder.items) {
                for (const item of paidOrder.items) {
                    await this.prisma.inventoryLedger.create({
                        data: {
                            variantId: item.variantId,
                            quantity: item.quantity,
                            type: 'out',
                            reference: `order_webhook_${paidOrder.customId}`
                        }
                    });
                    this.checkStockAfterDeduction(item.variantId, item.variant?.product?.title || 'Product');
                }
    async updateTracking(id: number, trackingId: string, courierCompanyName: string, status ?: string) {
                    const data: any = {
                        trackingId,
                        courierCompanyName
                    };

                    if (status) {
                        data.status = status;
                    } else {
                        data.status = 'shipped';
                    }

                    return this.prisma.order.update({
                        where: { id },
                        data
                    });
                }

    private async processOrderImages(orders: any[]) {
        const productIds = new Set<number>();
        orders.forEach(order => {
            if (order.items) {
                order.items.forEach(item => {
                    if (item.variant?.productId) {
                        productIds.add(item.variant.productId);
                    }
                });
            }
        });

        if (productIds.size === 0) return;

        const mediaItems = await this.prisma.media.findMany({
            where: {
                ownerType: 'product',
                ownerId: { in: Array.from(productIds) }
            }
        });

        const mediaWithUrls = await Promise.all(mediaItems.map(async (m) => ({
            ...m,
            url: await this.mediaService.getPresignedUrl(m.s3Key)
        })));

        orders.forEach(order => {
            if (order.items) {
                order.items.forEach(item => {
                    if (item.variant?.product) {
                        item.variant.product.media = mediaWithUrls.filter(m => m.ownerId === item.variant.productId);
                    }
                });
            }
        });
    }

    // Helper to check stock async without blocking
    async checkStock(variantId: number, productTitle: string) {
        try {
            const totalIn = await this.prisma.inventoryLedger.aggregate({ where: { variantId: variantId, type: 'in' }, _sum: { quantity: true } }).then(res => res._sum?.quantity || 0);
            const totalOut = await this.prisma.inventoryLedger.aggregate({ where: { variantId: variantId, type: 'out' }, _sum: { quantity: true } }).then(res => res._sum?.quantity || 0);
            this.notificationService.checkStockLevel(variantId, productTitle, totalIn - totalOut);
        } catch (e) {
            console.error('Failed to run background stock check', e);
        }
    }
}
