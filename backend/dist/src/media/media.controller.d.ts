import { MediaService } from './media.service';
export declare class MediaController {
    private readonly mediaService;
    constructor(mediaService: MediaService);
    uploadFile(file: Express.Multer.File): Promise<{
        url: any;
        key: any;
        s3Key: any;
    }>;
}
