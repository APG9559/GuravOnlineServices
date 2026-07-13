import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RateLimiterGuard } from './common/guards/rate-limiter.guard';

import { json, urlencoded } from 'express';

async function bootstrap() {
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbName = process.env.DB_NAME || 'familystore';
  console.log(`📡 Database Host target: ${dbHost} (Database: ${dbName})`);
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // Trust reverse proxy (Nginx, Cloudflare, etc.) to get correct client IP address
  const expressApp = app.getHttpAdapter().getInstance();
  if (typeof expressApp.set === 'function') {
    expressApp.set('trust proxy', 1);
  }

  app.setGlobalPrefix('api');

  // Health check — used by Docker HEALTHCHECK and load balancers
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/api/health', (_req: any, res: any) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Serve Digital Asset Links for Android Passkey validation (FIDO2)
  httpAdapter.get('/.well-known/assetlinks.json', (_req: any, res: any) => {
    const base64Hash = 'Vo_KYfi6AEJknVYVHHwSDhvDM298EWXpuWNc-hapfMY';
    const hexFingerprint = Buffer.from(base64Hash, 'base64url')
      .toString('hex')
      .toUpperCase()
      .match(/.{2}/g)
      .join(':');

    res.setHeader('Content-Type', 'application/json');
    res.json([
      {
        relation: [
          'delegate_permission/common.handle_all_urls',
          'delegate_permission/common.get_login_creds',
        ],
        target: {
          namespace: 'android_app',
          package_name: 'com.gurav.app',
          sha256_cert_fingerprints: [hexFingerprint],
        },
      },
    ]);
  });

  app.enableCors({  
    origin: true, // Allow all origins for debugging
    credentials: true,
  });
  // app.enableCors({
  //   origin: process.env.FRONTEND_URL
  //     ? process.env.FRONTEND_URL.split(',')
  //     : ['http://localhost:5173', 'http://localhost:80', 'http://localhost', 'capacitor://localhost', 'http://192.168.1.7:5173', 'capacitor://localhost:8000'],
  //   credentials: true,
  // });

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
    new LoggingInterceptor(),
  );
  app.useGlobalGuards(new RateLimiterGuard());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Gurav Online Services API')
    .setDescription('Kolhapur Municipal Services — backend API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📖 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
