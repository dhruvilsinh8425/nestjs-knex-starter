import { Injectable } from '@nestjs/common';
import { AuthUserResponse, SessionUserInfo } from 'src/api/auth/dto';
import { StatusType } from 'src/common/enums';
import { ApiException } from 'src/exceptions';
import { ApiEC } from 'src/exceptions/apiec.enum';
import { User } from 'src/models/user';
import { DeleteAvatarResponse, UpdateAvatarRequest, UpdateMeRequest, UserMeResponse } from './dto';

@Injectable()
export class UserService {
    async me(sessionUser: SessionUserInfo): Promise<UserMeResponse> {
        const user = await this.getUserById(sessionUser.id);

        return {
            user: this.toAuthUser(user),
        };
    }

    async updateMe(sessionUser: SessionUserInfo, dto: UpdateMeRequest): Promise<UserMeResponse> {
        const user = await this.getUserById(sessionUser.id);
        const patchData: Partial<User> = {};

        if (typeof dto.fullName !== 'undefined') {
            const { firstName, lastName } = this.splitFullName(dto.fullName);
            patchData.first_name = firstName;
            patchData.last_name = lastName;
        }

        if (typeof dto.email !== 'undefined') {
            const existingUser = await User.query()
                .modify('exist')
                .whereNot({ id: sessionUser.id })
                .findOne({ email: dto.email });

            if (existingUser) {
                throw new ApiException(ApiEC.EmailAlreadyExist);
            }

            patchData.email = dto.email || null;
        }

        const updatedUser = Object.keys(patchData).length ? await user.$query().patchAndFetch(patchData) : user;

        return {
            user: this.toAuthUser(updatedUser),
        };
    }

    async updateAvatar(sessionUser: SessionUserInfo, { avatar }: UpdateAvatarRequest): Promise<UserMeResponse> {
        const user = await this.getUserById(sessionUser.id);
        const updatedUser = await user.$query().patchAndFetch({ avatar });

        return {
            user: this.toAuthUser(updatedUser),
        };
    }

    async deleteAvatar(sessionUser: SessionUserInfo): Promise<DeleteAvatarResponse> {
        const user = await this.getUserById(sessionUser.id);
        await user.$query().patch({ avatar: null });

        return {
            message: 'Avatar removed successfully',
        };
    }

    private async getUserById(userId: number): Promise<User> {
        const user = await User.query().modify('newActive').findById(userId);

        if (!user || user.status === StatusType.Disabled) {
            throw new ApiException(ApiEC.UserNotFound);
        }

        return user;
    }

    private splitFullName(fullName?: string): { firstName: string | null; lastName: string | null } {
        const trimmedFullName = (fullName || '').trim();

        if (!trimmedFullName) {
            return {
                firstName: null,
                lastName: null,
            };
        }

        const [firstName, ...rest] = trimmedFullName.split(/\s+/);

        return {
            firstName: firstName || null,
            lastName: rest.length ? rest.join(' ') : null,
        };
    }

    private toAuthUser(user: User): AuthUserResponse {
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
