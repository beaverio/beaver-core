import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  app.setGlobalPrefix('v1', {
    exclude: [{ path: '/auth/*path', method: RequestMethod.ALL }],
  });

  app.use(cookieParser());

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
