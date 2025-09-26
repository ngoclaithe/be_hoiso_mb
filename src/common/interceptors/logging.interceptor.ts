import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const { method, originalUrl } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap((data) => {
        const responseTime = Date.now() - start;
        this.logger.logHttpRequest(req, res, responseTime);
        
        // Log success responses
        this.logger.log(
          `${method} ${originalUrl} - ${res.statusCode} - ${responseTime}ms`,
          'HTTP'
        );
      }),
      tap(
        null,
        (error) => {
          const responseTime = Date.now() - start;
          this.logger.error(
            `${method} ${originalUrl} - ERROR - ${responseTime}ms: ${error.message}`,
            error.stack,
            'HTTP'
          );
        }
      )
    );
  }
}