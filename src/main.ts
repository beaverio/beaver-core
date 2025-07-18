import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { SanitizationPipe } from './common/pipes/sanitization.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new SanitizationPipe(),
    new ValidationPipe({
      whitelist: true,
    }),
  );

  app.setGlobalPrefix('v1', {
    exclude: [
      { path: '/auth', method: RequestMethod.ALL },
      { path: '/auth/*path', method: RequestMethod.ALL },
      { path: '/health', method: RequestMethod.ALL },
      { path: '/health/*path', method: RequestMethod.ALL },
    ],
  });

  app.use(cookieParser());

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
