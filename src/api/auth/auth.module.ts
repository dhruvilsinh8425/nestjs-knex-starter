import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { CredsModule } from 'src/services/creds/creds.module';
import { MailModule } from 'src/services/mail';
import { OtpModule } from 'src/services/otp/otp.module';
import { SessionModule } from 'src/services/sessions/session.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy, LocalStrategy } from './passport-strategies';
import { SocialAuthService } from './social-auth.service';

@Module({
    imports: [PassportModule.register({ defaultStrategy: 'jwt' }), SessionModule, OtpModule, CredsModule, MailModule],
    controllers: [AuthController],
    providers: [AuthService, SocialAuthService, JwtStrategy, LocalStrategy],
    exports: [AuthService],
})
export class AuthModule {}
