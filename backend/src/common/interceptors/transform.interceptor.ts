import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseFormat<T> {
  success: boolean;
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResponseFormat<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseFormat<T>> {
    // Skip wrapping if response is a file stream or specific type
    const http = context.switchToHttp();
    const response = http.getResponse();
    if (response.headersSent) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        // If data is already wrapped or response should not be wrapped (like html or downloads)
        if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
          return data;
        }
        return {
          success: true,
          data,
        };
      }),
    );
  }
}
