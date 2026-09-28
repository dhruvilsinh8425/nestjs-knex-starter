import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ApiException } from 'src/exceptions';
import { ApiEC } from 'src/exceptions/apiec.enum';
import { AuthType } from '../enums';

export type UserPassportOptions = {
    /** Allow users whose email/phone is not verified yet. */
    allowUnverifiedUser?: boolean;
    /** Allow the short-lived session issued by login-with-phone before the OTP is verified. */
    isLoginVerifyOnly?: boolean;
    /** Allow guest sessions and anonymous requests (use with JwtGuestAuthGuard). */
    isGuestAllowed?: boolean;
};

export const UserPassport = createParamDecorator((options: UserPassportOptions | undefined, ctx: ExecutionContext) => {
    const user = ctx.switchToHttp().getRequest()?.user;

    if (!user || user.isGuest) {
        if (options?.isGuestAllowed) {
            return user;
        }
        throw new ApiException(ApiEC.AccessDenied);
    }

    if (user.isLoginVerifyOnly && !options?.isLoginVerifyOnly) {
        throw new ApiException(ApiEC.AccessDenied);
    }

    if (
        options?.allowUnverifiedUser ||
        user.isEmailVerified ||
        user.isPhoneVerified ||
        // Apple may hide the user's email, the identity token itself is the verification
        user.authType === AuthType.Apple
    ) {
        return user;
    }

    if (user.email) {
        throw new ApiException(ApiEC.UserEmailIsNotVerified);
    }

    throw new ApiException(ApiEC.UserPhoneIsNotVerified);
});
