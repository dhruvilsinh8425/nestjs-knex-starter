import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PageInfo } from './common.entity';

export class UserIdRequest {
    @ApiHideProperty()
    userId: number;
}

export class DeviceIdRequest {
    @ApiHideProperty()
    deviceId?: string;
}

export class PageInfoRequest {
    @ApiProperty({ required: false })
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => PageInfo)
    pageInfo?: PageInfo;
}

export class AppStoreRedirectRequest {
    appName?: string;
    webSite?: string;
    appleStoreUrl?: string;
    googlePlayUrl?: string;
    page?: string;
    id?: string | number;
}

export class TokenRequest {
    @IsString()
    @IsNotEmpty()
    token: string;
}
