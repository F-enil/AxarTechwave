import { CatalogService } from './catalog.service';
export declare class CatalogController {
    private readonly catalogService;
    constructor(catalogService: CatalogService);
    getCategories(): Promise<({
        children: {
            id: number;
            name: string;
            slug: string;
            parentId: number | null;
            sortOrder: number;
        }[];
    } & {
        id: number;
        name: string;
        slug: string;
        parentId: number | null;
        sortOrder: number;
    })[]>;
    getProducts(categoryId?: string, search?: string): Promise<{
        media: {
            url: string;
            id: number;
            createdAt: Date;
            sortOrder: number;
            ownerType: string;
            ownerId: number | null;
            kind: string;
            s3Key: string;
            alt: string | null;
            width: number | null;
            height: number | null;
        }[];
        variants: {
            stock: number;
            prices: {
                id: number;
                variantId: number;
                currency: string;
                basePrice: import("@prisma/client/runtime/library").Decimal;
                compareAtPrice: import("@prisma/client/runtime/library").Decimal | null;
                priceListId: string | null;
            }[];
            id: number;
            productId: number;
            sku: string;
            barcode: string | null;
            attributes: import("@prisma/client/runtime/library").JsonValue | null;
            weight: number | null;
            dimensions: import("@prisma/client/runtime/library").JsonValue | null;
            status: string;
        }[];
        category: {
            id: number;
            name: string;
            slug: string;
            parentId: number | null;
            sortOrder: number;
        };
        id: number;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        status: string;
        slug: string;
        description: string | null;
        taxClassId: string | null;
        hsnSac: string | null;
        brand: string | null;
        categoryId: number | null;
        originCountry: string | null;
        taxRate: number;
        cgst: number;
        sgst: number;
        igst: number;
    }[]>;
    getProduct(slug: string): Promise<{
        variants: {
            stock: number;
            prices: {
                id: number;
                variantId: number;
                currency: string;
                basePrice: import("@prisma/client/runtime/library").Decimal;
                compareAtPrice: import("@prisma/client/runtime/library").Decimal | null;
                priceListId: string | null;
            }[];
            id: number;
            productId: number;
            sku: string;
            barcode: string | null;
            attributes: import("@prisma/client/runtime/library").JsonValue | null;
            weight: number | null;
            dimensions: import("@prisma/client/runtime/library").JsonValue | null;
            status: string;
        }[];
        media: {
            url: string;
            id: number;
            createdAt: Date;
            sortOrder: number;
            ownerType: string;
            ownerId: number | null;
            kind: string;
            s3Key: string;
            alt: string | null;
            width: number | null;
            height: number | null;
        }[];
        category: {
            id: number;
            name: string;
            slug: string;
            parentId: number | null;
            sortOrder: number;
        };
        id: number;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        status: string;
        slug: string;
        description: string | null;
        taxClassId: string | null;
        hsnSac: string | null;
        brand: string | null;
        categoryId: number | null;
        originCountry: string | null;
        taxRate: number;
        cgst: number;
        sgst: number;
        igst: number;
    }>;
    createProduct(data: any): Promise<any>;
    updateProduct(id: string, data: any): Promise<{
        success: boolean;
    }>;
    deleteProduct(id: string): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        status: string;
        slug: string;
        description: string | null;
        taxClassId: string | null;
        hsnSac: string | null;
        brand: string | null;
        categoryId: number | null;
        originCountry: string | null;
        taxRate: number;
        cgst: number;
        sgst: number;
        igst: number;
    }>;
}
