"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const prisma_module_1 = require("./prisma/prisma.module");
const users_module_1 = require("./users/users.module");
const auth_module_1 = require("./auth/auth.module");
const catalog_module_1 = require("./catalog/catalog.module");
const media_module_1 = require("./media/media.module");
const cart_module_1 = require("./cart/cart.module");
const orders_module_1 = require("./orders/orders.module");
const stats_module_1 = require("./stats/stats.module");
const newsletter_module_1 = require("./newsletter/newsletter.module");
const reviews_module_1 = require("./reviews/reviews.module");
const wishlist_module_1 = require("./wishlist/wishlist.module");
const address_module_1 = require("./address/address.module");
const contact_module_1 = require("./contact/contact.module");
const cms_module_1 = require("./cms/cms.module");
const notification_module_1 = require("./notifications/notification.module");
const rms_module_1 = require("./rms/rms.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            throttler_1.ThrottlerModule.forRoot([{
                    ttl: 60000,
                    limit: 60,
                }]),
            prisma_module_1.PrismaModule,
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            catalog_module_1.CatalogModule,
            media_module_1.MediaModule,
            cart_module_1.CartModule,
            orders_module_1.OrdersModule,
            stats_module_1.StatsModule,
            newsletter_module_1.NewsletterModule,
            reviews_module_1.ReviewsModule,
            wishlist_module_1.WishlistModule,
            address_module_1.AddressModule,
            contact_module_1.ContactModule,
            cms_module_1.CmsModule,
            notification_module_1.NotificationModule,
            rms_module_1.RmsModule
        ],
        controllers: [],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard
            }
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map