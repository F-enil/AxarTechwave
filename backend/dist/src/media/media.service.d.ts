import { ConfigService } from '@nestjs/config';
export declare class MediaService {
    private config;
    constructor(config: ConfigService);
    uploadFile(file: Express.Multer.File): Promise<any>;
    getPresignedUrl(key: string): Promise<string>;
    uploadUrl(key: string): Promise<void>;
}
