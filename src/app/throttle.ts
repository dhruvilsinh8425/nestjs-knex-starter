import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle, ThrottlerGuard, ThrottlerModuleOptions } from '@nestjs/throttler';
import { ApiException } from 'src/exceptions';
import { ApiEC } from 'src/exceptions/apiec.enum';

const envNumber = (key: string, fallback: number) => parseInt(process.env[key] || `${fallback}`, 10) || fallback;

export const throttlerOptions = (configService: ConfigService): ThrottlerModuleOptions => ({
    throttlers: [
        {
            name: 'default',
            ttl: Number(configService.get('THROTTLE_TTL_SEC', 60)) * 1000,
            limit: Number(configService.get('THROTTLE_LIMIT', 100)),
        },
    ],
});

/** Stricter per-IP limit for routes that send codes or check passwords. */
export const AuthThrottle = () =>
    Throttle({
        default: {
            ttl: () => envNumber('THROTTLE_TTL_SEC', 60) * 1000,
            limit: () => envNumber('THROTTLE_AUTH_LIMIT', 10),
        },
    });

/** Back to the global limit, for routes inside an `@AuthThrottle()` controller. */
export const DefaultThrottle = () =>
    Throttle({
        default: {
            ttl: () => envNumber('THROTTLE_TTL_SEC', 60) * 1000,
            limit: () => envNumber('THROTTLE_LIMIT', 100),
        },
    });

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
    protected async throwThrottlingException(): Promise<void> {
        throw new ApiException(ApiEC.TooManyRequests);
    }
}
