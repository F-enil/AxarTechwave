import { Controller, Get, Query, Post, UseInterceptors, UploadedFile, UseGuards, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('media')
export class MediaController {
    constructor(private readonly mediaService: MediaService) { }

    @Post('upload')
    @UseGuards(AuthGuard('jwt'))
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('No file provided');

        // Security: Whitelist Extensions
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('Invalid file type. Only JPG, PNG, WEBP allowed.');
        }

        const result = await this.mediaService.uploadFile(file);
        return {
            url: result.secure_url,
            key: result.public_id, // Cloudinary Public ID
            // Map legacy fields for frontend compatibility if needed
            s3Key: result.public_id
        };
    }
}
