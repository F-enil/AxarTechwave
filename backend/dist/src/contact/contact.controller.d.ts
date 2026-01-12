import { ContactService } from './contact.service';
export declare class ContactController {
    private readonly contactService;
    constructor(contactService: ContactService);
    create(body: any): Promise<any>;
    findAll(req: any): Promise<any>;
}
