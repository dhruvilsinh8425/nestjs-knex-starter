import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiHeader, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiErrorResponse } from 'src/exceptions/dto';
import { AuthService } from './auth.service';
import { UserPassport } from './decorators';
import { JwtAuthGuard, JwtGuestAuthGuard, LocalAuthGuard } from './guards';
import {
    AppleSignInRequest,
    AuthSignInRequest,
    AuthSuccessResponse,
    CheckUserExistsRequest,
    CheckUserExistsResponse,
    CreateAccountRequest,
    GoogleSignInRequest,
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

const deviceIdHeader = 'x-device-id';
const DeviceIdHeader = () =>
    ApiHeader({ name: deviceIdHeader, required: false, description: 'One session per user per device' });

@ApiTags('Auth')
@ApiSecurity('X_API_KEY')
@ApiBadRequestResponse({
    description: 'Bad response',
    type: ApiErrorResponse,
})
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('send-otp')
    @ApiOperation({ summary: 'Send login OTP to a mobile number' })
    async sendOtp(@Body() dto: SendOtpRequest): Promise<SendOtpResponse> {
        return this.authService.sendOtp(dto);
    }

    @Post('verify-otp')
    @DeviceIdHeader()
    @ApiOperation({ summary: 'Verify the OTP from send-otp and log in (creates the account if needed)' })
    async verifyOtp(
        @Body() dto: VerifyOtpRequest,
        @Headers(deviceIdHeader) deviceId?: string
    ): Promise<VerifyOtpResponse> {
        return this.authService.verifyOtp(dto, deviceId);
    }

    @Post('login-with-phone')
    @ApiOperation({ summary: 'Send login OTP and return a verify-only session for verify-login-otp' })
    async loginWithPhone(@Body() dto: LoginWithPhoneRequest): Promise<AuthSuccessResponse> {
        return this.authService.loginWithPhone(dto);
    }

    @Post('verify-login-otp')
    @ApiSecurity('X_SESSION_KEY')
    @UseGuards(JwtAuthGuard)
    @DeviceIdHeader()
    @ApiOperation({ summary: 'Verify the phone or email OTP of the current session and log in' })
    async verifyLoginOtp(
        @UserPassport({ allowUnverifiedUser: true, isLoginVerifyOnly: true }) sessionUser: SessionUserInfo,
        @Body() dto: VerifyLoginOtpRequest,
        @Headers(deviceIdHeader) deviceId?: string
    ): Promise<AuthSuccessResponse> {
        return this.authService.verifyLoginOtp(sessionUser, dto, deviceId);
    }

    @Post('resend-verification-otp')
    @ApiSecurity('X_SESSION_KEY')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Resend the phone or email verification OTP' })
    async resendVerifyOTP(
        @UserPassport({ allowUnverifiedUser: true, isLoginVerifyOnly: true }) sessionUser: SessionUserInfo,
        @Body() dto: ResendVerifyOTPRequest
    ): Promise<OtpSentResponse> {
        return this.authService.resendVerifyOTP(sessionUser, dto);
    }

    @Post('check-user-exists')
    @ApiOperation({ summary: 'Check if an email or phone is already registered' })
    async checkUserExists(@Body() dto: CheckUserExistsRequest): Promise<CheckUserExistsResponse> {
        return this.authService.checkUserExists(dto);
    }

    @Post('create-account')
    @DeviceIdHeader()
    @ApiOperation({ summary: 'Create an account with email & password (sends an email OTP)' })
    async createAccount(
        @Body() dto: CreateAccountRequest,
        @Headers(deviceIdHeader) deviceId?: string
    ): Promise<AuthSuccessResponse> {
        return this.authService.createAccount(dto, deviceId);
    }

    @Post('sign-in')
    @UseGuards(LocalAuthGuard)
    @DeviceIdHeader()
    @ApiOperation({ summary: 'Sign in with email & password' })
    async signIn(
        @UserPassport({ allowUnverifiedUser: true }) sessionUser: SessionUserInfo,
        @Body() dto: AuthSignInRequest,
        @Headers(deviceIdHeader) deviceId?: string
    ): Promise<AuthSuccessResponse> {
        return this.authService.signIn(sessionUser, dto, deviceId);
    }

    @Post('guest-sign-in')
    @DeviceIdHeader()
    @ApiOperation({ summary: 'Create a guest session' })
    async guestSignIn(
        @Body() dto: GuestSignInRequest,
        @Headers(deviceIdHeader) deviceId?: string
    ): Promise<GuestSignInResponse> {
        return this.authService.guestSignIn(dto, deviceId);
    }

    @Post('google-sign-in')
    @DeviceIdHeader()
    @ApiOperation({ summary: 'Sign in with a Google ID token' })
    async googleSignIn(
        @Body() dto: GoogleSignInRequest,
        @Headers(deviceIdHeader) deviceId?: string
    ): Promise<AuthSuccessResponse> {
        return this.authService.googleSignIn(dto, deviceId);
    }

    @Post('apple-sign-in')
    @DeviceIdHeader()
    @ApiOperation({ summary: 'Sign in with an Apple identity token' })
    async appleSignIn(
        @Body() dto: AppleSignInRequest,
        @Headers(deviceIdHeader) deviceId?: string
    ): Promise<AuthSuccessResponse> {
        return this.authService.appleSignIn(dto, deviceId);
    }

    @Post('reset-password')
    @ApiOperation({ summary: 'Send a reset password OTP to an email or phone' })
    async resetPassword(@Body() dto: ResetPasswordRequest): Promise<OtpSentResponse> {
        return this.authService.resetPassword(dto);
    }

    @Post('verify-reset-password-otp')
    @ApiOperation({ summary: 'Verify the reset password OTP and get a recovery token' })
    async verifyResetPasswordOTP(@Body() dto: VerifyResetPasswordOTPRequest): Promise<ResetPasswordTokenResponse> {
        return this.authService.verifyResetPasswordOTP(dto);
    }

    @Post('recover-password')
    @ApiOperation({ summary: 'Set a new password with the recovery token (signs out everywhere)' })
    async recoverPassword(@Body() dto: RecoverPasswordRequest): Promise<SessionTokenResponse> {
        return this.authService.recoverPassword(dto);
    }

    @Post('login-with-token')
    @DeviceIdHeader()
    @ApiOperation({ summary: 'Log in with the one-time token from recover-password' })
    async loginWithToken(
        @Body() dto: LoginWithTokenRequest,
        @Headers(deviceIdHeader) deviceId?: string
    ): Promise<AuthSuccessResponse> {
        return this.authService.loginWithToken(dto, deviceId);
    }

    @Post('refresh')
    @DeviceIdHeader()
    @ApiOperation({ summary: 'Get a new access token with a refresh token' })
    async refresh(
        @Body() dto: RefreshTokenRequest,
        @Headers(deviceIdHeader) deviceId?: string
    ): Promise<RefreshTokenResponse> {
        return this.authService.refresh(dto, deviceId);
    }

    @Post('logout')
    @ApiSecurity('X_SESSION_KEY')
    @UseGuards(JwtGuestAuthGuard)
    @ApiOperation({ summary: 'Revoke the refresh token and end the current session' })
    async logout(
        @UserPassport({ isGuestAllowed: true, allowUnverifiedUser: true, isLoginVerifyOnly: true })
        sessionUser: SessionUserInfo | undefined,
        @Body() dto: LogoutRequest
    ): Promise<LogoutResponse> {
        return this.authService.logout(dto, sessionUser);
    }
}
