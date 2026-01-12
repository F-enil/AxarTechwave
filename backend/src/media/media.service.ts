import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class MediaService {
    constructor(private config: ConfigService) {
        cloudinary.config({
            cloud_name: this.config.get('CLOUDINARY_CLOUD_NAME'),
            api_key: this.config.get('CLOUDINARY_API_KEY'),
            api_secret: this.config.get('CLOUDINARY_API_SECRET'),
        });
    }

    async uploadFile(file: Express.Multer.File): Promise<any> {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder: 'axar-techwave' },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                },
            );
            streamifier.createReadStream(file.buffer).pipe(uploadStream);
        });
    }

    // Deprecated but kept for compatibility logic (if any)
    async getPresignedUrl(key: string) {
        // Cloudinary URLs are public unless strict. Assuming public for now.
        // If 'key' is full URL, return it.
        return key;
    }

    async uploadUrl(key: string) {
        throw new BadRequestException('Use POST /media/upload with FormData instead of presigned URLs');
    }
}
