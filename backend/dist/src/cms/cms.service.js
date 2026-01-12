"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CmsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CmsService = class CmsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSettings() {
        const defaults = {
            title: 'Axar TechWave',
            logo: 'logo.png',
            social: {
                facebook: 'https://facebook.com',
                instagram: 'https://instagram.com',
                whatsapp: 'https://wa.me/'
            },
            contact: {
                phone: '+91 12345 67890',
                email: 'support@axartechwave.com',
                address: 'Surat, Gujarat'
            },
            maintenanceMode: false
        };
        const settings = await this.prisma.cmsSettings.findMany();
        const config = Object.assign({}, defaults);
        settings.forEach(s => {
            if (s.key === 'site_config') {
                const dbValue = s.value;
                Object.assign(config, dbValue);
            }
        });
        return config;
    }
    async updateSettings(data) {
        return this.prisma.cmsSettings.upsert({
            where: { key: 'site_config' },
            create: { key: 'site_config', value: data },
            update: { value: data }
        });
    }
};
exports.CmsService = CmsService;
exports.CmsService = CmsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CmsService);
//# sourceMappingURL=cms.service.js.map