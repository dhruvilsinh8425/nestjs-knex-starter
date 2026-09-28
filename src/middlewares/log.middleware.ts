import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';
import { ZReqLogType } from 'src/common/enums';
import { ZRequestLog } from 'src/models';

const maxStoredLength = 10 * 1024;
const masked = '***';
const sensitiveHeaders = ['x-api-key', 'x-session-key', 'authorization', 'cookie'];
const sensitiveFields = [
    'password',
    'newPassword',
    'otp',
    'code',
    'token',
    'accessToken',
    'refreshToken',
    'recoveryToken',
    'idToken',
    'identityToken',
];
const mobileUserAgents = /cfnetwork|darwin|okhttp|dart|android|iphone|ipad/i;

@Injectable()
export class LogMiddleware implements NestMiddleware {
    private readonly logger = new Logger(LogMiddleware.name);
    private readonly isOn: boolean;
    private readonly apiPrefix: string;

    constructor(configService: ConfigService) {
        this.isOn = configService.get<string>('IS_REQUEST_LOG_ON', 'false') === 'true';
        this.apiPrefix = configService.get<string>('API_ROUTE_PREFIX', 'api');
    }

    use(req: Request, res: Response, next: NextFunction) {
        const url = req.originalUrl.toLowerCase();
        const isLogged =
            this.isOn &&
            url.startsWith(`/${this.apiPrefix}/`) &&
            !url.startsWith(`/${this.apiPrefix}/webhooks`) &&
            !url.startsWith(`/${this.apiPrefix}/common/health-check`);

        if (!isLogged) {
            return next();
        }

        const startedAt = Date.now();
        const chunks: Buffer[] = [];
        let size = 0;
        const collect = (chunk: any, encoding?: any) => {
            if (!chunk || typeof chunk === 'function' || size >= maxStoredLength) {
                return;
            }
            const buffer = Buffer.isBuffer(chunk)
                ? chunk
                : Buffer.from(chunk, typeof encoding === 'string' ? (encoding as BufferEncoding) : 'utf8');
            chunks.push(buffer);
            size += buffer.length;
        };

        const originalWrite = res.write.bind(res);
        const originalEnd = res.end.bind(res);
        res.write = ((chunk: any, ...args: any[]) => {
            collect(chunk, args[0]);
            return originalWrite(chunk, ...args);
        }) as Response['write'];
        res.end = ((chunk?: any, ...args: any[]) => {
            collect(chunk, args[0]);
            return originalEnd(chunk, ...args);
        }) as Response['end'];

        res.on('finish', () => {
            const user = (req as any).user;
            const hasBody = ['POST', 'PUT', 'PATCH'].includes(req.method);

            ZRequestLog.query()
                .insert({
                    user_id: user && !user.isGuest && user.id ? user.id : null,
                    type: mobileUserAgents.test(req.header('user-agent') || '') ? ZReqLogType.AlMob : ZReqLogType.AlWeb,
                    method: req.method,
                    route: req.path.slice(0, 1024),
                    headers: LogMiddleware.stringify(LogMiddleware.maskHeaders(req.headers)),
                    get: Object.keys(req.query || {}).length ? LogMiddleware.stringify(req.query) : null,
                    post: hasBody && req.body ? LogMiddleware.stringify(LogMiddleware.maskBody(req.body)) : null,
                    status_code: `${res.statusCode}`,
                    response: LogMiddleware.maskResponse(Buffer.concat(chunks).toString('utf8')),
                    duration_ms: Date.now() - startedAt,
                })
                .catch((err) => this.logger.error(`Cannot save request log: ${err?.message}`));
        });

        next();
    }

    private static maskHeaders(headers: Request['headers']): Record<string, unknown> {
        return Object.fromEntries(
            Object.entries(headers).map(([key, value]) => [
                key,
                sensitiveHeaders.includes(key.toLowerCase()) ? masked : value,
            ])
        );
    }

    private static maskBody(value: unknown): unknown {
        if (Array.isArray(value)) {
            return value.map((item) => LogMiddleware.maskBody(item));
        }
        if (value && typeof value === 'object') {
            return Object.fromEntries(
                Object.entries(value).map(([key, item]) => [
                    key,
                    sensitiveFields.includes(key) ? masked : LogMiddleware.maskBody(item),
                ])
            );
        }
        return value;
    }

    private static maskResponse(body: string): string | null {
        if (!body) {
            return null;
        }

        try {
            return LogMiddleware.stringify(LogMiddleware.maskBody(JSON.parse(body)));
        } catch {
            return body.slice(0, maxStoredLength);
        }
    }

    private static stringify(value: unknown): string {
        return JSON.stringify(value).slice(0, maxStoredLength);
    }
}
