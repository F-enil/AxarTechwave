import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { google } from 'googleapis';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as path from 'path';

// Define the shape of the Google Content API Product
interface GoogleProduct {
    offerId: string;
    title: string;
    description: string;
    link: string;
    imageLink: string;
    contentLanguage: string;
    targetCountry: string;
    feedLabel: string;
    channel: string;
    availability: string;
    condition: string;
    googleProductCategory: string; // Optional but good for SEO
    brand: string;
    price: {
        value: string;
        currency: string;
    };
    shipping: any[];
}

@Injectable()
export class MerchantService {
    private readonly logger = new Logger(MerchantService.name);
    private contentApi;
    private merchantId: string; // Will be determined dynamically or set in env

    constructor(private prisma: PrismaService) {
        this.initGoogleClient();
    }

    async initGoogleClient() {
        try {
            const keyFilePath = path.join(process.cwd(), 'google-merchant-key.json');
            const auth = new google.auth.GoogleAuth({
                keyFile: keyFilePath,
                scopes: ['https://www.googleapis.com/auth/content'],
            });

            const client = await auth.getClient();
            this.contentApi = google.content({ version: 'v2.1', auth: client as any });

            // Attempt to get Merchant ID from the authenticated client if possible, 
            // or we assume the user puts it in the Env. 
            // For now, we'll try to fetch auth info or rely on a hardcoded ID if provided.
            // Usually, the Merchant ID is the separate number found in Merchant Center. 
            // We will assume it is passed via ENV or we try to list accounts.

            this.logger.log('Google Merchant Client Initialized');
        } catch (error) {
            this.logger.error('Failed to initialize Google Client', error);
        }
    }

    // Run automatically every day at midnight
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleCron() {
        this.logger.log('Running Scheduled Merchant Center Sync...');
        await this.syncProducts();
    }

    async syncProducts() {
        // 0. Ensure Auth
        if (!this.contentApi) await this.initGoogleClient();

        // 1. Get Merchant ID (Fetch accounts if not set)
        if (!this.merchantId) {
            try {
                // "auth" is already attached to contentApi
                const authResponse = await this.contentApi.accounts.authinfo();
                // The authenticated user's merchant ID is usually in accountIdentifiers
                // OR we list accounts.
                // Let's rely on a simpler approach: Listing accounts for this auth.
                const accounts = await this.contentApi.accounts.list({ merchantId: authResponse.data.accountIdentifiers[0].merchantId });
                // This is tricky without explicit ID. Let's try to find the primary account.
                if (accounts.data.resources && accounts.data.resources.length > 0) {
                    this.merchantId = accounts.data.resources[0].id; // Use the first account
                    this.logger.log(`Detected Merchant ID: ${this.merchantId}`);
                } else {
                    // Fallback: Check ENV
                    this.merchantId = process.env.GOOGLE_MERCHANT_ID;
                }
            } catch (e) {
                this.logger.warn('Could not auto-detect Merchant ID, checking ENV...');
                this.merchantId = process.env.GOOGLE_MERCHANT_ID;
            }

            if (!this.merchantId) {
                throw new Error('GOOGLE_MERCHANT_ID is not set in .env and could not be auto-detected.');
            }
        }

        // 2. Fetch Products from DB
        const products = await this.prisma.product.findMany({
            where: { isVisible: true }, // Only sync visible products
            include: {
                category: true,
                variants: true
            }
        });

        this.logger.log(`Found ${products.length} products to sync.`);

        // 3. Map to Google Format
        const entries = products.map((product, index) => {
            const price = product.discountPrice || product.price;
            const isInStock = product.stock > 0;

            return {
                batchId: index,
                merchantId: this.merchantId,
                method: 'insert',
                product: {
                    offerId: product.id.toString(),
                    title: product.name,
                    description: product.description || product.name,
                    link: `${process.env.FRONTEND_URL || 'https://www.axartechwave.com'}/product/${product.slug || product.id}`,
                    imageLink: product.images && product.images.length > 0 ? product.images[0] : '',
                    contentLanguage: 'en',
                    targetCountry: 'IN',
                    feedLabel: 'IN',
                    channel: 'online',
                    availability: isInStock ? 'in stock' : 'out of stock',
                    condition: 'new',
                    brand: 'Axar TechWave', // Or dynamic if you have brand field
                    price: {
                        value: price.toString(),
                        currency: 'INR'
                    },
                    shipping: [{
                        country: 'IN',
                        service: 'Standard',
                        price: { value: '0', currency: 'INR' } // Free shipping implementation
                    }]
                }
            };
        });

        // 4. Send Batch Request (Google limits batch size, usually 1000 is safe)
        const BATCH_SIZE = 500;
        const results = [];

        for (let i = 0; i < entries.length; i += BATCH_SIZE) {
            const chunk = entries.slice(i, i + BATCH_SIZE);
            try {
                const response = await this.contentApi.products.custombatch({
                    requestBody: { entries: chunk }
                });
                results.push(...(response.data.entries || []));
                this.logger.log(`Synced batch ${i} - ${i + chunk.length}`);
            } catch (err) {
                this.logger.error(`Batch sync failed for index ${i}`, err);
            }
        }

        return {
            total: products.length,
            results: results.length
        };
    }
}
