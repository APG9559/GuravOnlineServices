import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from "@nestjs/common";

@Injectable()
export class RateLimiterGuard implements CanActivate {
  private clients = new Map<string, { count: number; resetTime: number }>();
  private readonly WINDOW_MS = 60 * 1000; // 1 minute window
  private readonly MAX_REQUESTS = 300; // max 250 requests per minute

  constructor() {
    // Periodically prune expired entries every 5 minutes to prevent memory leaks
    setInterval(
      () => {
        const now = Date.now();
        for (const [ip, data] of this.clients.entries()) {
          if (now > data.resetTime) {
            this.clients.delete(ip);
          }
        }
      },
      5 * 60 * 1000,
    ).unref();
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const rawIp =
      request.headers["x-forwarded-for"] ||
      request.ip ||
      request.socket.remoteAddress ||
      "unknown";
    const ip =
      typeof rawIp === "string"
        ? rawIp.split(",")[0].trim()
        : Array.isArray(rawIp)
          ? rawIp[0]
          : rawIp;

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
        "Too many requests, please try again later.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
