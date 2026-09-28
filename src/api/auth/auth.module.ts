import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { OtpModule } from 'src/services/otp/otp.module';
import { SessionModule } from 'src/services/sessions/session.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './passport-strategies';

@Module({
    imports: [PassportModule.register({ defaultStrategy: 'jwt' }), SessionModule, OtpModule],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    exports: [AuthService],
})
export class AuthModule {}
