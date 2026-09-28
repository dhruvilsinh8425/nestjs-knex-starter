import momentTZ from 'moment-timezone';
import { nanoid } from 'nanoid';
import { AnyQueryBuilder } from 'objection';
import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { AuthSessionUserResponse, AuthSuccessResponse } from 'src/api/auth/dto';
import { authConstants } from 'src/api/auth/auth.constants';
import { StatusType } from 'src/common/enums';
import { ApiException } from 'src/exceptions';
import { ApiEC } from 'src/exceptions/apiec.enum';
import { ApiSuccessResponse } from 'src/exceptions/dto';
import { Session, User } from 'src/models';
import { AuthSessionUserRequest, CreateGuestSessionRequest, CreateUserSessionRequest } from './dto';

const dateTimeFormat = 'YYYY-MM-DD HH:mm:ss';

@Injectable()
export class SessionService {
    constructor(private readonly jwtService: JwtService) {}

    private signOptions(expiresInSec: number): JwtSignOptions {
        return {
            issuer: (process.env.PROJECT_NAME || 'app').replace(/\s/g, '.').toLowerCase(),
            expiresIn: expiresInSec,
            secret: process.env.JWT_SECRET,
        };
    }

    async createUserSession(
        user: User,
        { deviceId, fcmToken, deviceType, isLoginVerifyOnly = false }: CreateUserSessionRequest
    ): Promise<AuthSuccessResponse> {
        if (!user) {
            throw new ApiException(ApiEC.InternalServerError);
        }

        const ttl = isLoginVerifyOnly ? authConstants().loginVerifySessionTTL : authConstants().sessionTTL;
        const sessionToken = nanoid();
        const accessToken = await this.jwtService.signAsync(
            { id: user.id, sessionToken, isLoginVerifyOnly },
            this.signOptions(ttl)
        );

        await this.upsertSession({
            userId: user.id,
            sessionToken,
            ttl,
            deviceId,
            // A pending OTP login must not replace (log out) an existing full session on this device
            fcmToken: isLoginVerifyOnly ? undefined : fcmToken,
            deviceType,
            reuseExisting: !isLoginVerifyOnly,
        });

        return {
            accessToken,
            ...(await this.getUserBySessionToken({ userId: user.id, sessionToken })),
        };
    }

    async createGuestSession({
        deviceId,
        fcmToken,
        deviceType,
    }: CreateGuestSessionRequest): Promise<{ accessToken: string; token: string }> {
        const ttl = authConstants().sessionTTL;
        const sessionToken = nanoid();
        const accessToken = await this.jwtService.signAsync(
            { sessionToken, isGuest: true, isLoginVerifyOnly: false },
            this.signOptions(ttl)
        );

        await this.upsertSession({ userId: null, sessionToken, ttl, deviceId, fcmToken, deviceType });

        return { accessToken, token: sessionToken };
    }

    private async upsertSession({
        userId,
        sessionToken,
        ttl,
        deviceId,
        fcmToken,
        deviceType,
        reuseExisting = true,
    }: {
        userId: number | null;
        sessionToken: string;
        ttl: number;
        deviceId?: string;
        fcmToken?: string;
        deviceType?: CreateUserSessionRequest['deviceType'];
        reuseExisting?: boolean;
    }): Promise<void> {
        const expiredAt = momentTZ().add(ttl, 'seconds').format(dateTimeFormat);
        const lastUseAt = momentTZ().format(dateTimeFormat);

        const currentSession =
            reuseExisting && deviceId
                ? await Session.query()
                      .modify('active')
                      .where((builder: AnyQueryBuilder) => {
                          userId ? builder.where({ user_id: userId }) : builder.whereNull('user_id');
                      })
                      .findOne({ device_id: deviceId })
                : undefined;

        let sessionId: number;
        if (currentSession) {
            await currentSession.$query().patch({
                token: sessionToken,
                expired_at: expiredAt,
                last_use_at: lastUseAt,
                fcm_token: fcmToken ?? currentSession.fcm_token ?? null,
                device_type: deviceType ?? currentSession.device_type ?? null,
            });
            sessionId = currentSession.id;
        } else {
            const session = await Session.query().insert({
                user_id: userId,
                device_id: deviceId ?? null,
                fcm_token: fcmToken ?? null,
                device_type: deviceType ?? null,
                token: sessionToken,
                expired_at: expiredAt,
                last_use_at: lastUseAt,
                status: StatusType.Active,
            });
            sessionId = session.id;
        }

        if (fcmToken) {
            await Session.query()
                .modify('active')
                .whereNot({ id: sessionId })
                .where({ fcm_token: fcmToken })
                .patch({ status: StatusType.Deleted });
        }
    }

    async getUserBySessionToken({ userId, sessionToken }: AuthSessionUserRequest): Promise<AuthSessionUserResponse> {
        if (!userId || !sessionToken) {
            throw new ApiException(ApiEC.WrongInput);
        }

        const userSession = await Session.query()
            .modify('active')
            .withGraphFetched('user')
            .where(`${Session.tableName}.user_id`, userId)
            .findOne({ token: sessionToken });

        if (!userSession?.user || ![StatusType.New, StatusType.Active].includes(userSession.user.status)) {
            throw new ApiException(ApiEC.AccessDenied);
        }

        userSession.user.sessionToken = userSession.token;

        return {
            sessionUser: userSession.user.toSessionUserInfoDTO(),
        };
    }

    async getGuestSession(sessionToken: string): Promise<Session | undefined> {
        if (!sessionToken) {
            return;
        }

        return Session.query().modify('active').whereNull('user_id').findOne({ token: sessionToken });
    }

    async deleteUserSession({ userId, sessionToken }: AuthSessionUserRequest): Promise<ApiSuccessResponse> {
        if (!userId) {
            return { ok: true };
        }

        await Session.query()
            .patch({ status: StatusType.Deleted })
            .where({ user_id: userId })
            .where((builder: AnyQueryBuilder) => {
                if (sessionToken) {
                    builder.where({ token: sessionToken });
                }
            });

        return { ok: true };
    }
}
