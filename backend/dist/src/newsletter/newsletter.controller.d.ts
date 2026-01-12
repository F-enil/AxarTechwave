import { NewsletterService } from './newsletter.service';
export declare class NewsletterController {
    private readonly newsletterService;
    constructor(newsletterService: NewsletterService);
    subscribe(email: string): Promise<{
        message: string;
        subscriber: any;
    }>;
    findAll(): Promise<any>;
}
