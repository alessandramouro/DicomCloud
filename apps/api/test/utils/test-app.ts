import { ValidationPipe, INestApplication, VersioningType } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';

import { AppModule } from '../../src/app.module';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { LoggingInterceptor } from '../../src/common/interceptors/logging.interceptor';
import { TransformInterceptor } from '../../src/common/interceptors/transform.interceptor';

/** Bootstraps the real AppModule with the same global pipes/filters/interceptors as main.ts (minus Swagger/static assets, which E2E specs don't need). */
export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1', prefix: 'api/v' });

  await app.init();
  return app;
}
