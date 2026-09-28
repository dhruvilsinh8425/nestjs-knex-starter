import { Injectable, NestMiddleware, Module } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApiException } from 'src/exceptions';
import { ApiEC } from 'src/exceptions/apiec.enum';

@Injectable()
@Module({
    imports: [ConfigModule],
})
export class ApiMiddleware implements NestMiddleware {
    constructor(private configService: ConfigService) {}

    private isVersionValid(current: string, required: string): boolean {
        const cur = current.split('.').map(Number);
        const req = required.split('.').map(Number);

        for (let i = 0; i < Math.max(cur.length, req.length); i++) {
            const c = cur[i] || 0;
            const r = req[i] || 0;

            if (c > r) return true;
            if (c < r) return false;
        }
        return true;
    }

    use(req: Request, res: Response, next: NextFunction) {
        const apiPrefix = this.configService.get('API_ROUTE_PREFIX', 'api');

        const isProtectedRoute =
            req.originalUrl.match(new RegExp(`/${apiPrefix}/`, 'gi')) &&
            !req.originalUrl.match(new RegExp(`/${apiPrefix}/webhooks`, 'gi')) &&
            !req.originalUrl.match(new RegExp(`/${apiPrefix}/common/health-check`, 'gi'));

        if (!isProtectedRoute) {
            return next();
        }

        // 1️⃣ API KEY CHECK
        const reqApiKey = req.header('X-API-Key');
        if (reqApiKey !== this.configService.get('API_APP_KEY', '')) {
            return next(new ApiException(ApiEC.WrongAppKey));
        }

        // 2️⃣ VERSION CHECK (Mobile Only)
        const userAgent = (req.header('user-agent') || '').toLowerCase();
        const appVersion = req.header('x-app-version');

        const platform: 'ios' | 'android' =
            userAgent.includes('cfnetwork') || userAgent.includes('darwin') ? 'ios' : 'android';
        if (platform && appVersion) {
            const minVersion = platform === 'ios' ? '1.0.15' : platform === 'android' ? '1.0.17' : null;

            if (minVersion && !this.isVersionValid(appVersion, minVersion)) {
                return next(new ApiException(ApiEC.UnsupportedAppVersion));
            }
        }
        return next();
    }
}
