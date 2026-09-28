import { ApiProperty } from '@nestjs/swagger';
import { AuthUserResponse } from 'src/api/auth/dto/responses.dto';

export class UserMeResponse {
    @ApiProperty({ type: () => AuthUserResponse })
    user: AuthUserResponse;
}

export class DeleteAvatarResponse {
    @ApiProperty()
    message: string;
}
