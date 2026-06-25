import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { httpRequestDuration } from '../metrics/app-metrics';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, ip } = request;
    const route = request.route?.path || url;
    const requestId = (request as any).id || 'unknown';
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - start;
          const statusCode = response.statusCode;
          httpRequestDuration.observe(
            { method, route, status_code: String(statusCode) },
            duration / 1000,
          );
          this.logger.log(
            `[${requestId}] ${method} ${url} ${statusCode} ${duration}ms - ${ip}`,
          );
        },
        error: (error) => {
          const duration = Date.now() - start;
          httpRequestDuration.observe(
            { method, route, status_code: String(error.status || 500) },
            duration / 1000,
          );
          this.logger.error(
            `[${requestId}] ${method} ${url} ERROR ${duration}ms - ${error.message}`,
          );
        },
      }),
    );
  }
}
