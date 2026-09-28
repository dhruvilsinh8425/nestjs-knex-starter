import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsAppEmail, TransformStringTrimLowerCase } from 'src/common/decorators';

export class UpdateMeRequest {
    @IsOptional()
    @IsString()
    fullName?: string;

    @TransformStringTrimLowerCase()
    @IsAppEmail()
    @IsOptional()
    email?: string;
}

export class UpdateAvatarRequest {
    @IsString()
    @IsNotEmpty()
    avatar: string;
}
