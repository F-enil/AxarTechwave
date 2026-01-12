import { Injectable } from '@nestjs/common';

@Injectable()
export class TaxService {
    calculateTax(amount: number, state: string, taxRate: number = 18) {
        // Normalize state check (case insensitive)
        const isGujarat = state && state.toLowerCase().trim() === 'gujarat';

        // Handling undefined state: default to IGST (Inter-state) if unknown, or maybe Intra?
        // Safest is IGST if not essentially local.

        const rate = Number(taxRate) || 18;

        let cgst = 0;
        let sgst = 0;
        let igst = 0;

        if (isGujarat) {
            const halfRate = rate / 2;
            cgst = Number(((amount * halfRate) / 100).toFixed(2));
            sgst = Number(((amount * halfRate) / 100).toFixed(2));
        } else {
            igst = Number(((amount * rate) / 100).toFixed(2));
        }

        const totalTax = Number((cgst + sgst + igst).toFixed(2));

        return {
            taxableAmount: amount,
            cgst,
            sgst,
            igst,
            totalTax,
            taxRate: rate,
            type: isGujarat ? 'intra_state' : 'inter_state'
        };
    }
    calculateItemTax(price: number, quantity: number, state: string, rates: { cgst: number, sgst: number, igst: number }) {
        const amount = Number(price) * quantity;
        const isGujarat = state && state.toLowerCase().trim() === 'gujarat';

        let cgst = 0;
        let sgst = 0;
        let igst = 0;

        if (isGujarat) {
            // Use configured Intra-state rates
            cgst = Number(((amount * rates.cgst) / 100).toFixed(2));
            sgst = Number(((amount * rates.sgst) / 100).toFixed(2));
        } else {
            // Use configured Inter-state rate
            igst = Number(((amount * rates.igst) / 100).toFixed(2));
        }

        return {
            taxableAmount: amount,
            cgst,
            sgst,
            igst,
            totalTax: Number((cgst + sgst + igst).toFixed(2))
        };
    }
}
