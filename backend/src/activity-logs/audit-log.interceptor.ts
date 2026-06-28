import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ActivityLogService } from './activity-log.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly activityLogService: ActivityLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, body } = request;

    // Only intercept mutations (POST, PUT, PATCH, DELETE)
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    if (!isMutation) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((response) => {
        try {
          const actionMap: Record<string, string> = {
            POST: 'CREATE',
            PUT: 'UPDATE',
            PATCH: 'UPDATE',
            DELETE: 'DELETE',
          };

          const action = actionMap[method] || method;
          
          // Determine module from URL path (e.g. /api/affidavits -> affidavits)
          const parts = url.split('/');
          const apiIndex = parts.indexOf('api');
          const moduleName = apiIndex !== -1 && parts[apiIndex + 1] 
            ? parts[apiIndex + 1].split('?')[0] 
            : 'system';

          // Prevent logging activity-logs endpoints to avoid infinite recursion
          if (moduleName === 'activity-logs') {
            return;
          }

          const recordId = response?.id || request.params?.id || null;

          // Scrub sensitive information from body
          const cleanBody = { ...body };
          delete cleanBody.password;
          delete cleanBody.passwordConfirm;

          const details = {
            params: request.params,
            body: cleanBody,
            responseId: response?.id || null,
          };

          // Save the log asynchronously without delaying response to user
          this.activityLogService.createLog(
            action,
            moduleName,
            recordId ? String(recordId) : null,
            details,
            user || null,
          ).catch((err) => {
            console.error('Failed to save audit log:', err);
          });
        } catch (error) {
          console.error('Error during audit log recording:', error);
        }
      }),
    );
  }
}
