import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('catalog')
export class CatalogController {
    constructor(private readonly catalogService: CatalogService) { }

    @Get('categories')
    getCategories() {
        return this.catalogService.getCategories();
    }

    @Get('products')
    getProducts(@Query('category') categoryId?: string, @Query('search') search?: string) {
        const where: any = {};
        if (categoryId) where.categoryId = Number(categoryId);
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        return this.catalogService.getProducts({ where });
    }

    @Get('products/:slug')
    getProduct(@Param('slug') slug: string) {
        return this.catalogService.getProduct(slug);
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
