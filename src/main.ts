import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as path from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useStaticAssets(path.join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  const config = new DocumentBuilder()
    .setTitle('O2Shop API')
    .setDescription(
      'REST API for the O2Shop e-commerce platform. ' +
        'Public endpoints need no authentication. ' +
        'Customer endpoints require a JWT bearer token (from POST /auth/login). ' +
        'Admin endpoints additionally require the `admin` role.',
    )
    .setVersion('1.0.0')
    .addServer('http://localhost:3001', 'Local development')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste the access_token value from POST /auth/login.',
      },
      'access_token',
    )
    .addTag('Auth', 'Registration, login, Google OAuth')
    .addTag('Products', 'Public product catalogue')
    .addTag('Collections', 'Product collections')
    .addTag('Categories', 'Product categories and subcategories')
    .addTag('Reviews', 'Product reviews — public read, auth write')
    .addTag('Orders', 'Order placement and status lookup')
    .addTag('Shipping Methods', 'Available shipping options')
    .addTag('Me', 'Authenticated user profile, orders, and addresses')
    .addTag('Addresses', 'Saved shipping/billing addresses')
    .addTag('Admin – Products', 'Admin: full product CRUD')
    .addTag('Admin – Orders', 'Admin: order management')
    .addTag('Admin – Reviews', 'Admin: review moderation')
    .addTag('Admin – Collections', 'Admin: collection management')
    .addTag('Admin – Categories', 'Admin: category and subcategory management')
    .addTag('Admin – Shipping', 'Admin: shipping method management')
    .addTag('Admin – Users', 'Admin: user management')
    .addTag('Admin – Audit Log', 'Admin: change history for all entities')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 3,
    },
    customSiteTitle: 'O2Shop API Docs',
  });

  const specsDir = path.join(process.cwd(), 'specs');
  fs.mkdirSync(specsDir, { recursive: true });
  fs.writeFileSync(
    path.join(specsDir, 'openapi.json'),
    JSON.stringify(document, null, 2),
  );

  await app.listen(3001);
  console.log('API docs: http://localhost:3001/api/docs');
}
void bootstrap();
