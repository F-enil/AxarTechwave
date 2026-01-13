import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Security: Helmet
    app.use(helmet());

    // Security: Strict CORS
    app.enableCors({
        origin: [
            'http://localhost:5500', 
            'http://127.0.0.1:5500',
            'https://www.axartechwave.com',
            'https://axartechwave.com'
        ], // Allow local dev AND production
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    });

    // Security: Global Validation (Strip unknown fields)
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));

    app.setGlobalPrefix('api');
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`\n\n🚀 SERVER STARTED ON PORT ${port} 🚀\nWaiting for requests...\n\n`);
}
bootstrap();
