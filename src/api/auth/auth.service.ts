import { Injectable } from '@nestjs/common';
import moment from 'moment';
import { nanoid } from 'nanoid';
import { commonConstants } from 'src/common/constants';
import { StatusType, UserType } from 'src/common/enums';
import { ApiException } from 'src/exceptions';
import { ApiEC } from 'src/exceptions/apiec.enum';
import { SessionToken } from 'src/models/session.token';
import { User } from 'src/models/user';
import { OtpType } from 'src/services/otp/enums';
import { OtpService } from 'src/services/otp/otp.service';
import { AuthSessionUserRequest } from 'src/services/sessions/dto';
import { SessionService } from 'src/services/sessions/session.service';
import { AuthType } from './enums';
import {
    AuthSessionUserResponse,
    AuthUserResponse,
    LogoutRequest,
    LogoutResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    SendOtpRequest,
    SendOtpResponse,
    SessionUserInfo,
    VerifyOtpRequest,
    VerifyOtpResponse,
} from './dto';

const refreshTokenPrefix = 'refresh_';

@Injectable()
export class AuthService {
    constructor(
        private readonly sessionService: SessionService,
        private readonly otpService: OtpService
    ) {}

    async sendOtp({ mobileNumber }: SendOtpRequest): Promise<SendOtpResponse> {
        const normalizedMobileNumber = this.normalizeMobileNumber(mobileNumber);
        const existingUser = await this.getExistingUserByMobileNumber(normalizedMobileNumber);

        if (existingUser?.status === StatusType.Disabled) {
            throw new ApiException(ApiEC.AccountInactive);
        }

        const otpResponse = await this.otpService.requestOTPCode(this.toOtpSessionUserInfo(normalizedMobileNumber), {
            otpType: OtpType.VerifyPhone,
        });

        if (!otpResponse.isSent && otpResponse.timeout <= 0) {
            throw new ApiException(ApiEC.ServiceUnavailable);
        }

        return { message: 'OTP sent successfully' };
    }

    async verifyOtp({ mobileNumber, otp }: VerifyOtpRequest): Promise<VerifyOtpResponse> {
        const normalizedMobileNumber = this.normalizeMobileNumber(mobileNumber);

        if (otp !== commonConstants.otpCode) {
            const isOtpValid = await this.otpService.isOtpCodeValid({
                channel: normalizedMobileNumber,
                code: otp,
                otpType: OtpType.VerifyPhone,
            });

            if (!isOtpValid) {
                throw new ApiException(ApiEC.OTPCodeExpired);
            }
        }

        await this.otpService.disableOtpCode({
            channel: normalizedMobileNumber,
            otpType: OtpType.VerifyPhone,
            force: true,
        });

        let user = await this.getExistingUserByMobileNumber(normalizedMobileNumber);

        if (user?.status === StatusType.Disabled) {
            throw new ApiException(ApiEC.AccountInactive);
        }

        if (!user) {
            user = await User.query().insertAndFetch({
                auth_type: AuthType.Phone,
                user_type: UserType.Tenant,
                phone: normalizedMobileNumber,
                is_phone_verified: true,
                status: StatusType.Active,
            });
        } else {
            user = await user.$query().patchAndFetch({
                auth_type: AuthType.Phone,
                phone: normalizedMobileNumber,
                is_phone_verified: true,
                status: StatusType.Active,
            });
        }

        const authSession = await this.sessionService.createUserSession(user, {});
        const refreshToken = await this.issueRefreshToken(user.id);
        const currentUser = await this.getUserById(user.id);

        return {
            message: 'Login successful',
            accessToken: authSession.accessToken,
            refreshToken,
            user: this.toAuthUser(currentUser),
        };
    }

    async refresh({ refreshToken }: RefreshTokenRequest): Promise<RefreshTokenResponse> {
        const currentRefreshToken = await this.getActiveRefreshToken(refreshToken);
        const user = await this.getUserById(currentRefreshToken.user_id);

        if (user.status === StatusType.Disabled) {
            await currentRefreshToken.$query().patch({ status: StatusType.Deleted });
            throw new ApiException(ApiEC.AccountInactive);
        }

        const authSession = await this.sessionService.createUserSession(user, {});
        await currentRefreshToken.$query().patch({ status: StatusType.Deleted });

        return {
            accessToken: authSession.accessToken,
            refreshToken: await this.issueRefreshToken(user.id),
        };
    }

    async logout({ refreshToken }: LogoutRequest): Promise<LogoutResponse> {
        const currentRefreshToken = await SessionToken.query().modify('active').findOne({ token: refreshToken });

        if (currentRefreshToken) {
            await currentRefreshToken.$query().patch({ status: StatusType.Deleted });
            await this.sessionService.deleteUserSession({ userId: currentRefreshToken.user_id });
        }

        return { message: 'Logged out successfully' };
    }

    async getUserBySessionToken(dto: AuthSessionUserRequest): Promise<AuthSessionUserResponse> {
        return this.sessionService.getUserBySessionToken(dto);
    }

    private normalizeMobileNumber(mobileNumber: string): string {
        return (mobileNumber || '').replace(/\s+/g, '').replace(/-/g, '').trim();
    }

    private async getUserById(userId: number): Promise<User> {
        const user = await User.query().modify('newActive').findById(userId);

        if (!user) {
            throw new ApiException(ApiEC.UserNotFound);
        }

        return user;
    }

    private async getExistingUserByMobileNumber(mobileNumber: string): Promise<User | undefined> {
        return User.query().modify('exist').findOne({ phone: mobileNumber });
    }

    private async issueRefreshToken(userId: number): Promise<string> {
        await SessionToken.query()
            .patch({ status: StatusType.Deleted })
            .where({ user_id: userId, status: StatusType.Active })
            .where('token', 'like', `${refreshTokenPrefix}%`);

        const refreshToken = `${refreshTokenPrefix}${nanoid(96)}`;

        await SessionToken.query().insert({
            user_id: userId,
            token: refreshToken,
            expired_at: moment()
                .add(this.getRefreshTokenExpiryInSeconds(), 'seconds')
                .format('YYYY-MM-DD HH:mm:ss'),
            status: StatusType.Active,
        });

        return refreshToken;
    }

    private async getActiveRefreshToken(refreshToken: string): Promise<SessionToken> {
        if (!refreshToken?.startsWith(refreshTokenPrefix)) {
            throw new ApiException(ApiEC.AccessDenied);
        }

        const currentRefreshToken = await SessionToken.query().modify('active').findOne({ token: refreshToken });

        if (!currentRefreshToken) {
            throw new ApiException(ApiEC.AccessDenied);
        }

        return currentRefreshToken;
    }

    private getRefreshTokenExpiryInSeconds(): number {
        return parseInt(
            process.env.JWT_REFRESH_MAX_AGE_SEC || `${parseInt(process.env.JWT_MAX_AGE_SEC || '86400', 10) * 30}`,
            10
        );
    }

    private toOtpSessionUserInfo(mobileNumber: string): SessionUserInfo {
        return {
            id: 0,
            authType: AuthType.Phone,
            userType: UserType.Tenant,
            phone: mobileNumber,
            isPhoneVerified: false,
            status: StatusType.New,
        };
    }

    private toAuthUser(user: User): AuthUserResponse {
        return {
            id: user.id,
            fullName: this.getFullName(user),
            email: user.email ?? null,
            mobileNumber: user.phone ?? null,
            avatar: user.avatar ?? null,
            createdAt: user.created_at ?? null,
            updatedAt: user.updated_at ?? null,
        };
    }

    private getFullName(user: User): string | null {
        const fullName = [user.first_name, user.last_name].filter((value) => !!value).join(' ').trim();
        return fullName || null;
    }
}
