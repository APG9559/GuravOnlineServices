import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class RateLimiterGuard implements CanActivate {
  private clients = new Map<string, { count: number; resetTime: number }>();
  private readonly WINDOW_MS = 60 * 1000; // 1 minute window
  private readonly MAX_REQUESTS = 100; // max 100 requests per minute

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.headers['x-forwarded-for'] || 'unknown';

    const now = Date.now();
    const client = this.clients.get(ip);

    if (!client || now > client.resetTime) {
      this.clients.set(ip, {
        count: 1,
        resetTime: now + this.WINDOW_MS,
      });
      return true;
    }

    client.count++;
    if (client.count > this.MAX_REQUESTS) {
      throw new HttpException(
        'Too many requests, please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
