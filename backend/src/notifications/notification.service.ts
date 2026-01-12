import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService {
    constructor(private prisma: PrismaService) { }

    async checkStockLevel(variantId: number, productTitle: string, currentStock: number) {
        if (currentStock <= 5) {
            const message = `⚠️ Low Stock Alert: "${productTitle}" has only ${currentStock} items remaining.`;
            await this.sendAdminAlert(message);
        }
    }

    async sendAdminAlert(message: string) {
        // 1. Dashboard Notification (Store in DB if we had a Notification model, otherwise just log or use a simple Message model)
        // We reused 'Contact' messages for admin before? No, let's just log for now or create a system note.
        // For accurate Dashboard display, we need a table.
        // But user asked for "Website Notification".
        // Let's console log first.
        console.log(`[DASHBOARD ALERT] ${message}`);

        // 2. WhatsApp (Mock)
        this.sendWhatsApp(message);

        // 3. Email (Mock)
        this.sendEmail(message);
    }

    private sendWhatsApp(message: string) {
        // Mock WhatsApp API
        // In real world: await axios.post('https://graph.facebook.com/...', { ... })
        console.log(`[WHATSAPP MOCK] 📱 Sending to Admin Phone: ${message}`);
    }

    private sendEmail(message: string) {
        // Mock Email
        // In real world: await transporter.sendMail({ ... })
        console.log(`[EMAIL MOCK] 📧 Sending to Admin Email: ${message}`);
    }
}
