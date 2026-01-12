import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { MediaService } from '../media/media.service';
export declare class CatalogService {
    private prisma;
    private mediaService;
    constructor(prisma: PrismaService, mediaService: MediaService);
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
    getProducts(params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.ProductWhereUniqueInput;
        where?: Prisma.ProductWhereInput;
        orderBy?: Prisma.ProductOrderByWithRelationInput;
    }): Promise<{
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
                basePrice: Prisma.Decimal;
                compareAtPrice: Prisma.Decimal | null;
                priceListId: string | null;
            }[];
            id: number;
            productId: number;
            sku: string;
            barcode: string | null;
            attributes: Prisma.JsonValue | null;
            weight: number | null;
            dimensions: Prisma.JsonValue | null;
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
                basePrice: Prisma.Decimal;
                compareAtPrice: Prisma.Decimal | null;
                priceListId: string | null;
            }[];
            id: number;
            productId: number;
            sku: string;
            barcode: string | null;
            attributes: Prisma.JsonValue | null;
            weight: number | null;
            dimensions: Prisma.JsonValue | null;
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
    updateProduct(id: number, data: any): Promise<{
        success: boolean;
    }>;
    deleteProduct(id: number): Promise<{
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
