import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ApiException } from 'src/exceptions';
import { ApiEC } from 'src/exceptions/apiec.enum';
import { AuthService } from '../auth.service';
import { GuestSessionInfo, JWTPayload, SessionUserInfo } from '../dto';

const headerSessionKey = 'x-session-key';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly authService: AuthService,
        configService: ConfigService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromHeader(headerSessionKey),
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
        });
    }

    async validate(dto: JWTPayload): Promise<SessionUserInfo | GuestSessionInfo> {
        if (!dto?.sessionToken) {
            throw new ApiException(ApiEC.AccessDenied);
        }

        if (dto.isGuest) {
            const guestSession = await this.authService.getGuestSession(dto.sessionToken);
            if (!guestSession) {
                throw new ApiException(ApiEC.AccessDenied);
            }
            return guestSession;
        }

        if (!dto.id) {
            throw new ApiException(ApiEC.AccessDenied);
        }

        const { sessionUser } = await this.authService.getUserBySessionToken({
            userId: dto.id,
            sessionToken: dto.sessionToken,
        });

        if (!sessionUser) {
            throw new ApiException(ApiEC.AccessDenied);
        }

        return { ...sessionUser, isLoginVerifyOnly: !!dto.isLoginVerifyOnly };
    }
}
