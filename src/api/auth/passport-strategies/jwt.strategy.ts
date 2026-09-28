import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ApiException } from 'src/exceptions';
import { ApiEC } from 'src/exceptions/apiec.enum';
import { AuthService } from '../auth.service';
import { JWTPayload, SessionUserInfo } from '../dto';

const headerSessionKey = 'x-session-key';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService
    ) {
        super({
            passReqToCallback: true,
            jwtFromRequest: ExtractJwt.fromHeader(headerSessionKey),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET'),
        });
    }

    async validate(_: Request, dto: JWTPayload): Promise<SessionUserInfo> {
        if (!dto?.id || !dto?.sessionToken) {
            throw new ApiException(ApiEC.AccessDenied);
        }

        const { sessionUser } = await this.authService.getUserBySessionToken({
            userId: dto.id,
            sessionToken: dto.sessionToken,
        });

        if (!sessionUser) {
            throw new ApiException(ApiEC.AccessDenied);
        }

        return sessionUser;
    }
}
