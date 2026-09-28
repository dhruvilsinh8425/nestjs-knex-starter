import moment from 'moment';
import { nanoid } from 'nanoid';
import { Injectable, Logger } from '@nestjs/common';
import { StatusType } from 'src/common/enums';
import { ApiException } from 'src/exceptions';
import { ApiEC } from 'src/exceptions/apiec.enum';
import { ResetToken, SessionToken, User } from 'src/models';
import { CredsService } from 'src/services/creds/creds.service';
import { EmailType, MailService } from 'src/services/mail';
import { OtpType } from 'src/services/otp/enums';
import { OtpService } from 'src/services/otp/otp.service';
import { AuthSessionUserRequest, CreateGuestSessionRequest } from 'src/services/sessions/dto';
import { SessionService } from 'src/services/sessions/session.service';
import { authConstants } from './auth.constants';
import { AuthType } from './enums';
import { SocialAuthService, SocialProfile } from './social-auth.service';
import {
    AppleSignInRequest,
    AuthSessionUserResponse,
    AuthSignInRequest,
    AuthSuccessResponse,
    AuthUserResponse,
    CheckUserExistsRequest,
    CheckUserExistsResponse,
    CreateAccountRequest,
    DeviceInfoRequest,
    GoogleSignInRequest,
    GuestSessionInfo,
    GuestSignInRequest,
    GuestSignInResponse,
    LoginWithPhoneRequest,
    LoginWithTokenRequest,
    LogoutRequest,
    LogoutResponse,
    OtpSentResponse,
    RecoverPasswordRequest,
    RefreshTokenRequest,
    RefreshTokenResponse,
    ResendVerifyOTPRequest,
    ResetPasswordRequest,
    ResetPasswordTokenResponse,
    SendOtpRequest,
    SendOtpResponse,
    SessionTokenResponse,
    SessionUserInfo,
    VerifyLoginOtpRequest,
    VerifyOtpRequest,
    VerifyOtpResponse,
    VerifyResetPasswordOTPRequest,
} from './dto';

const dateTimeFormat = 'YYYY-MM-DD HH:mm:ss';

type SessionDeviceInfo = DeviceInfoRequest & { deviceId?: string };

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly sessionService: SessionService,
        private readonly otpService: OtpService,
        private readonly credsService: CredsService,
        private readonly mailService: MailService,
        private readonly socialAuthService: SocialAuthService
    ) {}

    // Session lookups (used by the passport strategies)

    async getUserBySessionToken(dto: AuthSessionUserRequest): Promise<AuthSessionUserResponse> {
        return this.sessionService.getUserBySessionToken(dto);
    }

    async getGuestSession(sessionToken: string): Promise<GuestSessionInfo | undefined> {
        const session = await this.sessionService.getGuestSession(sessionToken);
        return session ? { isGuest: true, sessionToken: session.token } : undefined;
    }

    async validateEmailPassword(email: string, password: string): Promise<SessionUserInfo> {
        const user = await User.query()
            .modify('exist')
            .findOne({ email: (email || '').trim().toLowerCase() });

        if (!user || !(await this.credsService.checkCredentials(user.id, password))) {
            throw new ApiException(ApiEC.IncorrectEmailOrPassword);
        }

        if (user.status === StatusType.Disabled) {
            throw new ApiException(ApiEC.AccountInactive);
        }

        return user.toSessionUserInfoDTO();
    }

    // Phone OTP, one step

    async sendOtp({ mobileNumber }: SendOtpRequest): Promise<SendOtpResponse> {
        const phone = AuthService.normalizePhone(mobileNumber);
        await this.assertNotDisabled(await User.query().modify('exist').findOne({ phone }));

        const otp = await this.otpService.requestOTPCode({ phone }, { otpType: OtpType.VerifyPhone });
        AuthService.assertOtpSent(otp);

        return { message: otp.isSent ? 'OTP sent successfully' : 'OTP already sent, please wait', ...otp };
    }

    async verifyOtp({ mobileNumber, otp, ...device }: VerifyOtpRequest, deviceId?: string): Promise<VerifyOtpResponse> {
        const phone = AuthService.normalizePhone(mobileNumber);
        await this.consumeOtp(phone, otp, OtpType.VerifyPhone);

        let user = await User.query().modify('exist').findOne({ phone });
        await this.assertNotDisabled(user);

        user = user
            ? await user.$query().patchAndFetch({ is_phone_verified: true, status: StatusType.Active })
            : await User.query().insertAndFetch({
                  auth_type: AuthType.Phone,
                  phone,
                  is_email_verified: false,
                  is_phone_verified: true,
                  status: StatusType.Active,
              });

        const login = await this.issueLogin(user, { ...device, deviceId });

        return { message: 'Login successful', ...login, user: AuthService.toAuthUser(user) };
    }

    // Phone OTP, two step

    async loginWithPhone({ countryCode, phone: rawPhone }: LoginWithPhoneRequest): Promise<AuthSuccessResponse> {
        const phone = AuthService.normalizePhone(rawPhone, countryCode);

        let user = await User.query().modify('exist').findOne({ phone });
        await this.assertNotDisabled(user);

        if (!user) {
            user = await User.query().insertAndFetch({
                auth_type: AuthType.Phone,
                country_code: AuthService.normalizeCountryCode(countryCode),
                phone,
                is_email_verified: false,
                is_phone_verified: false,
                status: StatusType.New,
            });
        }

        const otp = await this.otpService.requestOTPCode(
            { phone, fullName: user.fullName() },
            { otpType: OtpType.VerifyPhone, isNewOtp: true }
        );
        AuthService.assertOtpSent(otp);

        const session = await this.sessionService.createUserSession(user, { isLoginVerifyOnly: true });

        return { ...session, otp };
    }

    async verifyLoginOtp(
        sessionUser: SessionUserInfo,
        { email, countryCode, phone, code, ...device }: VerifyLoginOtpRequest,
        deviceId?: string
    ): Promise<AuthSuccessResponse> {
        const user = await this.getUserById(sessionUser.id);

        if (email) {
            if (email !== user.email) {
                throw new ApiException(ApiEC.InvalidRequest);
            }

            await this.consumeOtp(email, code, OtpType.VerifyEmail);
            await user.$query().patch({ is_email_verified: true, status: StatusType.Active });
        } else if (phone) {
            const normalizedPhone = AuthService.normalizePhone(phone, countryCode);
            if (normalizedPhone !== user.phone) {
                throw new ApiException(ApiEC.InvalidRequest);
            }

            await this.consumeOtp(normalizedPhone, code, OtpType.VerifyPhone);
            await user.$query().patch({ is_phone_verified: true, status: StatusType.Active });
        } else {
            throw new ApiException(ApiEC.PhoneOrEmailRequired);
        }

        if (sessionUser.isLoginVerifyOnly) {
            await this.sessionService.deleteUserSession({ userId: user.id, sessionToken: sessionUser.sessionToken });
        }

        return this.issueLogin(await this.getUserById(user.id), { ...device, deviceId });
    }

    async resendVerifyOTP(
        sessionUser: SessionUserInfo,
        { email, countryCode, phone }: ResendVerifyOTPRequest
    ): Promise<OtpSentResponse> {
        const user = await this.getUserById(sessionUser.id);
        const target = { email: user.email, phone: user.phone, fullName: user.fullName() };

        if (email) {
            if (email !== user.email) {
                throw new ApiException(ApiEC.InvalidRequest);
            }
            if (user.is_email_verified) {
                throw new ApiException(ApiEC.EmailAlreadyVerified);
            }

            return this.otpService.requestOTPCode(target, { otpType: OtpType.VerifyEmail });
        }

        if (phone) {
            if (AuthService.normalizePhone(phone, countryCode) !== user.phone) {
                throw new ApiException(ApiEC.InvalidRequest);
            }
            if (user.is_phone_verified && !sessionUser.isLoginVerifyOnly) {
                throw new ApiException(ApiEC.PhoneAlreadyVerified);
            }

            return this.otpService.requestOTPCode(target, { otpType: OtpType.VerifyPhone });
        }

        throw new ApiException(ApiEC.PhoneOrEmailRequired);
    }

    // Email & password

    async checkUserExists({ email, countryCode, phone }: CheckUserExistsRequest): Promise<CheckUserExistsResponse> {
        if (!email && !phone) {
            throw new ApiException(ApiEC.PhoneOrEmailRequired);
        }

        const user = await User.query()
            .whereIn('status', [StatusType.Active, StatusType.Disabled])
            .findOne(email ? { email } : { phone: AuthService.normalizePhone(phone, countryCode) });

        return { exists: !!user, status: user?.status, authType: user?.auth_type };
    }

    async createAccount(
        { email, password, firstName, lastName, ...device }: CreateAccountRequest,
        deviceId?: string
    ): Promise<AuthSuccessResponse> {
        const existing = await User.query().modify('exist').findOne({ email });
        if (existing && (existing.status !== StatusType.New || existing.is_email_verified)) {
            throw new ApiException(ApiEC.EmailAlreadyExist);
        }

        const userData = {
            auth_type: AuthType.Email,
            email,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            is_email_verified: false,
            status: StatusType.New,
        };

        const trx = await User.startTransaction();
        let user: User;
        try {
            user = existing
                ? await existing.$query(trx).patchAndFetch(userData)
                : await User.query(trx).insertAndFetch({ ...userData, is_phone_verified: false });
            await this.credsService.setCredentialsForUser(user.id, password, trx);
            await trx.commit();
        } catch (err) {
            await trx.rollback();
            throw err;
        }

        const otp = await this.otpService.requestOTPCode(
            { email, fullName: user.fullName() },
            { otpType: OtpType.VerifyEmail, isNewOtp: true }
        );

        return { ...(await this.issueLogin(user, { ...device, deviceId })), otp };
    }

    async signIn(
        sessionUser: SessionUserInfo,
        dto: AuthSignInRequest,
        deviceId?: string
    ): Promise<AuthSuccessResponse> {
        const { fcmToken, deviceType } = dto;
        return this.issueLogin(await this.getUserById(sessionUser.id), { fcmToken, deviceType, deviceId });
    }

    async guestSignIn(dto: GuestSignInRequest, deviceId?: string): Promise<GuestSignInResponse> {
        const request: CreateGuestSessionRequest = { ...dto, deviceId };
        const { accessToken } = await this.sessionService.createGuestSession(request);

        return { accessToken };
    }

    // Social sign in

    async googleSignIn({ idToken, ...device }: GoogleSignInRequest, deviceId?: string): Promise<AuthSuccessResponse> {
        const profile = await this.socialAuthService.verifyGoogleIdToken(idToken);
        const user = await this.findOrCreateSocialUser(AuthType.Google, profile);

        return this.issueLogin(user, { ...device, deviceId });
    }

    async appleSignIn(
        { identityToken, appleUserId, firstName, lastName, ...device }: AppleSignInRequest,
        deviceId?: string
    ): Promise<AuthSuccessResponse> {
        const profile = await this.socialAuthService.verifyAppleIdentityToken(identityToken, appleUserId);
        const user = await this.findOrCreateSocialUser(AuthType.Apple, {
            ...profile,
            firstName: firstName?.trim() || undefined,
            lastName: lastName?.trim() || undefined,
        });

        return this.issueLogin(user, { ...device, deviceId });
    }

    // Forgot password

    async resetPassword({ email, countryCode, phone }: ResetPasswordRequest): Promise<OtpSentResponse> {
        const { user, otpType } = await this.getResetPasswordTarget({ email, countryCode, phone });

        const otp = await this.otpService.requestOTPCode(
            { email: user.email, phone: user.phone, fullName: user.fullName() },
            { otpType }
        );
        AuthService.assertOtpSent(otp);

        return otp;
    }

    async verifyResetPasswordOTP({
        email,
        countryCode,
        phone,
        code,
    }: VerifyResetPasswordOTPRequest): Promise<ResetPasswordTokenResponse> {
        const { user, otpType } = await this.getResetPasswordTarget({ email, countryCode, phone });
        await this.consumeOtp(otpType === OtpType.ResetPasswordEmail ? user.email : user.phone, code, otpType);

        await ResetToken.query()
            .patch({ status: StatusType.Deleted })
            .where({ user_id: user.id, status: StatusType.Active });

        const recoveryToken = nanoid(authConstants().resetTokenLength);
        await ResetToken.query().insert({
            user_id: user.id,
            token: recoveryToken,
            expired_at: AuthService.expiresIn(authConstants().resetTokenTTL),
            status: StatusType.Active,
        });

        return { recoveryToken };
    }

    async recoverPassword({ recoveryToken, newPassword }: RecoverPasswordRequest): Promise<SessionTokenResponse> {
        const resetToken = await ResetToken.query().modify('active').findOne({ token: recoveryToken });
        if (!resetToken) {
            throw new ApiException(ApiEC.PasswordRecoveryTokenExpired);
        }

        await resetToken.$query().patch({ status: StatusType.Deleted });

        const user = await this.getUserById(resetToken.user_id);
        await this.credsService.setCredentialsForUser(user.id, newPassword);

        // Sign out everywhere
        await this.sessionService.deleteUserSession({ userId: user.id });
        await SessionToken.query()
            .patch({ status: StatusType.Deleted })
            .where({ user_id: user.id, status: StatusType.Active });

        if (user.email) {
            await this.mailService.sendMail({
                to: user.email,
                emailType: EmailType.PasswordChanged,
                locals: { fullName: user.fullName() },
            });
        }

        const token = nanoid(authConstants().loginTokenLength);
        await SessionToken.query().insert({
            user_id: user.id,
            token,
            expired_at: AuthService.expiresIn(authConstants().loginTokenTTL),
            status: StatusType.Active,
        });

        return { token };
    }

    async loginWithToken({ token, ...device }: LoginWithTokenRequest, deviceId?: string): Promise<AuthSuccessResponse> {
        if (!token || token.startsWith(authConstants().refreshTokenPrefix)) {
            throw new ApiException(ApiEC.InvalidRequest);
        }

        const sessionToken = await SessionToken.query().modify('active').findOne({ token });
        if (!sessionToken) {
            throw new ApiException(ApiEC.InvalidRequest);
        }

        await sessionToken.$query().patch({ status: StatusType.Deleted });

        return this.issueLogin(await this.getUserById(sessionToken.user_id), { ...device, deviceId });
    }

    // Tokens

    async refresh({ refreshToken }: RefreshTokenRequest, deviceId?: string): Promise<RefreshTokenResponse> {
        const currentRefreshToken = await this.getActiveRefreshToken(refreshToken);
        await currentRefreshToken.$query().patch({ status: StatusType.Deleted });

        const user = await User.query().modify('exist').findById(currentRefreshToken.user_id);
        if (!user || user.status === StatusType.Disabled) {
            throw new ApiException(ApiEC.AccountInactive);
        }

        const { accessToken } = await this.sessionService.createUserSession(user, { deviceId });

        return { accessToken, refreshToken: await this.issueRefreshToken(user.id) };
    }

    async logout({ refreshToken }: LogoutRequest, sessionUser?: SessionUserInfo): Promise<LogoutResponse> {
        const currentRefreshToken = await SessionToken.query().modify('active').findOne({ token: refreshToken });
        if (currentRefreshToken) {
            await currentRefreshToken.$query().patch({ status: StatusType.Deleted });
        }

        if (sessionUser?.id && sessionUser.sessionToken) {
            await this.sessionService.deleteUserSession({
                userId: sessionUser.id,
                sessionToken: sessionUser.sessionToken,
            });
        }

        return { message: 'Logged out successfully' };
    }

    // Helpers

    /** Full session, plus a refresh token once the user has verified an email or phone. */
    private async issueLogin(user: User, device: SessionDeviceInfo): Promise<AuthSuccessResponse> {
        await this.assertNotDisabled(user);

        const session = await this.sessionService.createUserSession(user, device);
        if (!user.isVerified()) {
            return session;
        }

        return { ...session, refreshToken: await this.issueRefreshToken(user.id) };
    }

    private async findOrCreateSocialUser(authType: AuthType.Google | AuthType.Apple, profile: SocialProfile) {
        const socialIdKey = authType === AuthType.Google ? 'social_google_id' : 'social_apple_id';

        let user = await User.query()
            .modify('exist')
            .findOne({ [socialIdKey]: profile.socialId });

        if (!user && profile.email && profile.isEmailVerified) {
            user = await User.query().modify('exist').findOne({ email: profile.email });
        }

        await this.assertNotDisabled(user);

        if (user) {
            return user.$query().patchAndFetch({
                [socialIdKey]: profile.socialId,
                first_name: user.first_name || profile.firstName || null,
                last_name: user.last_name || profile.lastName || null,
                avatar: user.avatar || profile.avatar || null,
                is_email_verified: user.is_email_verified || (profile.isEmailVerified && user.email === profile.email),
                status: StatusType.Active,
            });
        }

        const emailTaken = profile.email && (await User.query().modify('exist').findOne({ email: profile.email }));

        return User.query().insertAndFetch({
            auth_type: authType,
            [socialIdKey]: profile.socialId,
            email: emailTaken ? null : (profile.email ?? null),
            first_name: profile.firstName ?? null,
            last_name: profile.lastName ?? null,
            avatar: profile.avatar ?? null,
            is_email_verified: !emailTaken && !!profile.email && profile.isEmailVerified,
            is_phone_verified: false,
            status: StatusType.Active,
        });
    }

    private async getResetPasswordTarget({
        email,
        countryCode,
        phone,
    }: ResetPasswordRequest): Promise<{ user: User; otpType: OtpType }> {
        if (email) {
            const user = await User.query().modify('newActive').findOne({ email });
            if (!user) {
                throw new ApiException(ApiEC.UserNotFoundByEmail);
            }
            return { user, otpType: OtpType.ResetPasswordEmail };
        }

        if (phone) {
            const user = await User.query()
                .modify('newActive')
                .findOne({ phone: AuthService.normalizePhone(phone, countryCode) });
            if (!user) {
                throw new ApiException(ApiEC.UserNotFoundByPhone);
            }
            return { user, otpType: OtpType.ResetPasswordPhone };
        }

        throw new ApiException(ApiEC.PhoneOrEmailRequired);
    }

    private async consumeOtp(channel: string | null | undefined, code: string, otpType: OtpType): Promise<void> {
        if (!(await this.otpService.consumeOtpCode({ channel, code, otpType }))) {
            throw new ApiException(ApiEC.OTPCodeExpired);
        }
    }

    private async getUserById(userId: number): Promise<User> {
        const user = await User.query().modify('newActive').findById(userId);
        if (!user) {
            throw new ApiException(ApiEC.UserNotFound);
        }

        return user;
    }

    private async assertNotDisabled(user?: User): Promise<void> {
        if (user?.status === StatusType.Disabled) {
            throw new ApiException(ApiEC.AccountInactive);
        }
    }

    private async issueRefreshToken(userId: number): Promise<string> {
        const refreshToken = `${authConstants().refreshTokenPrefix}${nanoid(96)}`;

        await SessionToken.query().insert({
            user_id: userId,
            token: refreshToken,
            expired_at: AuthService.expiresIn(authConstants().refreshTokenTTL),
            status: StatusType.Active,
        });

        return refreshToken;
    }

    private async getActiveRefreshToken(refreshToken: string): Promise<SessionToken> {
        if (!refreshToken?.startsWith(authConstants().refreshTokenPrefix)) {
            throw new ApiException(ApiEC.AccessDenied);
        }

        const currentRefreshToken = await SessionToken.query().modify('active').findOne({ token: refreshToken });
        if (!currentRefreshToken) {
            throw new ApiException(ApiEC.AccessDenied);
        }

        return currentRefreshToken;
    }

    private static assertOtpSent({ isSent, timeout }: OtpSentResponse): void {
        if (!isSent && timeout <= 0) {
            throw new ApiException(ApiEC.ServiceUnavailable);
        }
    }

    private static expiresIn(seconds: number): string {
        return moment().add(seconds, 'seconds').format(dateTimeFormat);
    }

    private static normalizeCountryCode(countryCode?: string): string | null {
        const digits = (countryCode || '').replace(/\D/g, '');
        return digits ? `+${digits}` : null;
    }

    /** Returns the phone in international format (+<country code><number>). */
    static normalizePhone(phone?: string, countryCode?: string): string {
        const trimmed = (phone || '').trim();
        const digits = trimmed.replace(/\D/g, '');
        const countryDigits = (countryCode || '').replace(/\D/g, '');

        const normalized =
            trimmed.startsWith('+') || !countryDigits ? `+${digits}` : `+${countryDigits}${digits.replace(/^0+/, '')}`;

        if (!/^\+\d{7,15}$/.test(normalized)) {
            throw new ApiException(ApiEC.WrongInputPhone);
        }

        return normalized;
    }

    static toAuthUser(user: User): AuthUserResponse {
        const fullName = [user.first_name, user.last_name]
            .filter((value) => !!value)
            .join(' ')
            .trim();

        return {
            id: user.id,
            fullName: fullName || null,
            email: user.email ?? null,
            mobileNumber: user.phone ?? null,
            avatar: user.avatar ?? null,
            createdAt: user.created_at ?? null,
            updatedAt: user.updated_at ?? null,
        };
    }
}
