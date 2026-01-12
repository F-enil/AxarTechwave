export declare class TaxService {
    calculateTax(amount: number, state: string, taxRate?: number): {
        taxableAmount: number;
        cgst: number;
        sgst: number;
        igst: number;
        totalTax: number;
        taxRate: number;
        type: string;
    };
    calculateItemTax(price: number, quantity: number, state: string, rates: {
        cgst: number;
        sgst: number;
        igst: number;
    }): {
        taxableAmount: number;
        cgst: number;
        sgst: number;
        igst: number;
        totalTax: number;
    };
}
