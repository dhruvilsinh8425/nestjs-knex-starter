import { Body, Controller, Post } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiErrorResponse } from 'src/exceptions/dto';
import { AuthService } from './auth.service';
import { LogoutRequest, RefreshTokenRequest, SendOtpRequest, VerifyOtpRequest } from './dto';
import { LogoutResponse, RefreshTokenResponse, SendOtpResponse, VerifyOtpResponse } from './dto/responses.dto';

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
    @ApiOperation({ summary: 'Send login OTP to mobile number' })
    async sendOtp(@Body() dto: SendOtpRequest): Promise<SendOtpResponse> {
        return this.authService.sendOtp(dto);
    }

    @Post('verify-otp')
    @ApiOperation({ summary: 'Verify OTP and create login session' })
    async verifyOtp(@Body() dto: VerifyOtpRequest): Promise<VerifyOtpResponse> {
        return this.authService.verifyOtp(dto);
    }

    @Post('refresh')
    @ApiOperation({ summary: 'Refresh access token using refresh token' })
    async refresh(@Body() dto: RefreshTokenRequest): Promise<RefreshTokenResponse> {
        return this.authService.refresh(dto);
    }

    @Post('logout')
    @ApiOperation({ summary: 'Logout user and invalidate refresh token' })
    async logout(@Body() dto: LogoutRequest): Promise<LogoutResponse> {
        return this.authService.logout(dto);
    }
}
