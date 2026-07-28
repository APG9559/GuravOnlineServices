import "dotenv/config";
import "reflect-metadata";
import { NestFactory, Reflector } from "@nestjs/core";
import { ValidationPipe, ClassSerializerInterceptor, Logger } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";

import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import fastifyHelmet from "@fastify/helmet";
import fastifyMultipart from "@fastify/multipart";

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const dbHost = process.env.DB_HOST || "localhost";
  const dbName = process.env.DB_NAME || "familystore";
  logger.log(`📡 Database Host target: ${dbHost} (Database: ${dbName})`);
  
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true, bodyLimit: 10 * 1024 * 1024 }),
  );
  
  // Security Headers using @fastify/helmet
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: { // NestJS serves Swagger UI but no general frontend HTML from this port
      useDefaults: true,
      directives: {
        "default-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "data:"],
        "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", "data:", "blob:"],
        "font-src": ["'self'", "data:"],
        "connect-src": ["'self'"],
        "frame-src": ["'self'"],
        "worker-src": ["'self'", "blob:"],
        "manifest-src": ["'self'"],
        "child-src": ["'self'"],
        "object-src": ["'none'"],
        "base-uri": ["'self'"],
        "form-action": ["'self'"],
        "frame-ancestors": ["'self'"],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allows Capacitor WebViews to load assets
  });

  // Enable Multipart upload support (200MB max payload limit)
  await app.register(fastifyMultipart, {
    limits: { fileSize: 200 * 1024 * 1024 },
  });

  app.setGlobalPrefix("api");

  // Health check — used by Docker HEALTHCHECK and load balancers
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get("/api/health", (_req: any, res: any) => {
    res.type("application/json").send({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Serve Digital Asset Links for Android Passkey validation (FIDO2)
  httpAdapter.get("/.well-known/assetlinks.json", (_req: any, res: any) => {
    const base64Hash = "Vo_KYfi6AEJknVYVHHwSDhvDM298EWXpuWNc-hapfMY";
    const hexFingerprint = Buffer.from(base64Hash, "base64url")
      .toString("hex")
      .toUpperCase()
      .match(/.{2}/g)
      .join(":");

    res.type("application/json").send([
      {
        relation: [
          "delegate_permission/common.handle_all_urls",
          "delegate_permission/common.get_login_creds",
        ],
        target: {
          namespace: "android_app",
          package_name: "com.gurav.app",
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


  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle("Gurav Online Services API")
    .setDescription("Kolhapur Municipal Services — backend API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, "0.0.0.0");
  logger.log(`🚀 Server running on http://localhost:${port}`);
  logger.log(`📖 Swagger docs: http://localhost:${port}/api/docs`);

  // Initialize PostgreSQL pg_trgm trigram indexes asynchronously
  try {
    const { DataSource } = await import("typeorm");
    const { setupTrigramIndexes } = await import("./database/setup-trigram-indexes");
    const dataSource = app.get(DataSource);
    if (dataSource && dataSource.isInitialized) {
      await setupTrigramIndexes(dataSource);
    }
  } catch (err: any) {
    logger.warn(`Could not initialize trigram indexes: ${err?.message || err}`);
  }
}

bootstrap();
