import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import * as fs from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import helmet from 'helmet';


async function bootstrap() {
  const ssl = process.env.SSL === 'true';
  let httpsOptions = null;
  if (ssl) {
    httpsOptions = {
      key: fs.readFileSync(process.env.SSL_KEY_PATH || ''),
      cert: fs.readFileSync(process.env.SSL_CERT_PATH || ''),
    };
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    httpsOptions,
    logger: ['error', 'warn', 'log'],
  });

  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  );

  app.set('trust proxy', 1);

  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  // Serve the production build of the React video-conference client.
  // In development you run the Vite dev server (npm run dev in /frontend);
  // in production run `npm run build` there and this serves /frontend/dist.
  app.useStaticAssets(join(__dirname, '..', '..', 'frontend', 'dist'));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalInterceptors(new ResponseInterceptor());

  const config = new DocumentBuilder()
    .setTitle('Video Conference API')
    .setDescription(
      '**Video Conference** — REST + WebSocket signaling API.\n\n' +
      'Register/login via `Auth`, then click **Authorize** and paste your JWT.\n' +
      'All `/admin/*` endpoints additionally require the **admin** role.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'JWT',
    )
    .addTag('Auth', 'Register, login, current user')
    .addTag('Admin', 'User management & live meetings')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = Number(process.env.PORT) || 4000;
  const hostname = process.env.HOSTNAME || 'localhost';
  await app.listen(port, hostname, () => {
    const protocol = ssl ? 'https' : 'http';
    console.log(`\n🚀 Video Conference API running at ${protocol}://${hostname}:${port}/`);
    console.log(`📚 Swagger docs: ${protocol}://${hostname}:${port}/api-docs\n`);
  });
}
bootstrap();
