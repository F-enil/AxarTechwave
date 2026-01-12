import { Injectable } from '@nestjs/common';

@Injectable()
export class OrderIdService {
    generateOrderId(): string {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        // Generate a random 6-character alphanumeric string
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let random = '';
        for (let i = 0; i < 6; i++) {
            random += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // Format: AXAR-YYYYMMDD-XXXXXX
        return `AXAR-${year}${month}${day}-${random}`;
    }
}
