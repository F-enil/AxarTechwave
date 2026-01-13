import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('catalog')
export class CatalogController {
    constructor(private readonly catalogService: CatalogService) { }

    @Get('categories')
    async getCategories() {
        try {
            return await this.catalogService.getCategories();
        } catch (error) {
            console.error('Get categories failed', error);
            return [];
        }
    }

    @Get('products')
    async getProducts(@Query('category') categoryId?: string, @Query('search') search?: string) {
        try {
            const where: any = {};
            if (categoryId) where.categoryId = Number(categoryId);
            if (search) {
                where.OR = [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ];
            }
            return await this.catalogService.getProducts({ where });
        } catch (error) {
            console.error('Get products failed', error);
            // Return empty array to prevent frontend crash
            return [];
        }
    }

    @Get('products/:slug')
    async getProduct(@Param('slug') slug: string) {
        try {
            return await this.catalogService.getProduct(slug);
        } catch (error) {
            // Re-throw 404
            if (error.status === 404) throw error;
            console.error('Get product by slug failed', error);
            throw new Error('Product not found or unavailable');
        }
    }

    @UseGuards(JwtAuthGuard, AdminGuard)
    @Post('products')
    createProduct(@Body() data: any) {
        return this.catalogService.createProduct(data);
    }

    @UseGuards(JwtAuthGuard, AdminGuard)
    @Put('products/:id')
    updateProduct(@Param('id') id: string, @Body() data: any) {
        return this.catalogService.updateProduct(Number(id), data);
    }

    @UseGuards(JwtAuthGuard, AdminGuard)
    @Delete('products/:id')
    deleteProduct(@Param('id') id: string) {
        console.log(`[CatalogController] DELETE request for ID: ${id}`);
        if (!id || isNaN(Number(id))) {
            console.error(`[CatalogController] Invalid ID: ${id}`);
            throw new Error('Invalid ID');
        }
        return this.catalogService.deleteProduct(Number(id));
    }
}
