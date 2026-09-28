import { Body, Controller, Delete, Get, Patch, Put, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { UserPassport } from 'src/api/auth/decorators';
import { JwtAuthGuard } from 'src/api/auth/guards';
import { SessionUserInfo } from 'src/api/auth/dto';
import { ApiErrorResponse } from 'src/exceptions/dto';
import { DeleteAvatarResponse, UpdateAvatarRequest, UpdateMeRequest, UserMeResponse } from './dto';
import { UserService } from './user.service';

@ApiSecurity('X_API_KEY')
@ApiSecurity('X_SESSION_KEY')
@ApiTags('User')
@ApiBadRequestResponse({
    description: 'Bad response',
    type: ApiErrorResponse,
})
@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get('me')
    @ApiOperation({ summary: 'Get authenticated user profile' })
    async me(@UserPassport() sessionUser: SessionUserInfo): Promise<UserMeResponse> {
        return this.userService.me(sessionUser);
    }

    @Patch('me')
    @ApiOperation({ summary: 'Update authenticated user profile' })
    async updateMe(
        @UserPassport() sessionUser: SessionUserInfo,
        @Body() dto: UpdateMeRequest
    ): Promise<UserMeResponse> {
        return this.userService.updateMe(sessionUser, dto);
    }

    @Put('avatar')
    @ApiOperation({ summary: 'Update authenticated user avatar' })
    async updateAvatar(
        @UserPassport() sessionUser: SessionUserInfo,
        @Body() dto: UpdateAvatarRequest
    ): Promise<UserMeResponse> {
        return this.userService.updateAvatar(sessionUser, dto);
    }

    @Delete('avatar')
    @ApiOperation({ summary: 'Remove authenticated user avatar' })
    async deleteAvatar(@UserPassport() sessionUser: SessionUserInfo): Promise<DeleteAvatarResponse> {
        return this.userService.deleteAvatar(sessionUser);
    }
}
