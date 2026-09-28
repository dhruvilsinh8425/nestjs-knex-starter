import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Like JwtAuthGuard, but lets requests without a valid session through with `request.user` unset.
 * Pair with `@UserPassport({ isGuestAllowed: true })`.
 */
@Injectable()
export class JwtGuestAuthGuard extends AuthGuard('jwt') {
    canActivate(context: ExecutionContext) {
        return super.canActivate(context);
    }

    handleRequest(_err: any, user: any) {
        return user || undefined;
    }
}
