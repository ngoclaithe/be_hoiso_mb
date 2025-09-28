import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { LoggerService } from './common/logger/logger.service';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { json, raw } from 'express';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const loggerService = app.get(LoggerService);
  
  app.useLogger(loggerService);
  app.setGlobalPrefix('api/v1');
  app.useGlobalInterceptors(new LoggingInterceptor(loggerService));

  app.enableCors({
    origin: true, 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true, 
  });

// main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true, 
  forbidNonWhitelisted: true, 
  transform: true,
  disableErrorMessages: false,
  validationError: {
    target: false,
    value: false,
  },
  exceptionFactory: (errors) => {
    console.log('=== VALIDATION ERRORS ===');
    console.log(JSON.stringify(errors, null, 2));
    return new BadRequestException(errors);
  }
}));

  const port = process.env.PORT || 5010;
  
  await app.listen(port);
  
  console.log(`🚀 Server đang chạy tại http://localhost:${port}/api/v1`);
  loggerService.log(`Application started on port ${port}`, 'Bootstrap');
  loggerService.log(`Environment: ${process.env.NODE_ENV || 'development'}`, 'Bootstrap');
}

bootstrap().catch(err => {
  console.error('❌ Error starting server:', err);
});