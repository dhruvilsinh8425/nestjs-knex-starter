import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SessionService } from './session.service';
import type { StringValue } from 'ms';

@Module({
    imports: [
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: `${configService.get<string>('JWT_MAX_AGE_SEC')}s` as StringValue },
            }),
        }),
    ],
    providers: [SessionService],
    exports: [SessionService],
})
export class SessionModule {}
