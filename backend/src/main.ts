import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Health check for Render (must be before global prefix)
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/', (_req, res) => res.status(200).json({ status: 'ok' }));
  httpAdapter.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGINS', 'http://localhost:3000').split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global response transform interceptor
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger API docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('AI PPM Platform API')
    .setDescription('AI-Powered Project & Program Management Platform REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('portfolios', 'Portfolio management')
    .addTag('programs', 'Program management')
    .addTag('projects', 'Project management')
    .addTag('tasks', 'Task management')
    .addTag('risks', 'Risk & Issue management')
    .addTag('resources', 'Resource management')
    .addTag('financials', 'Financial management')
    .addTag('ai-copilot', 'AI Copilot endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('APP_PORT', 3001);
  await app.listen(port);
  logger.log(`🚀 API running on: http://localhost:${port}/api/v1`);
  logger.log(`📖 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
