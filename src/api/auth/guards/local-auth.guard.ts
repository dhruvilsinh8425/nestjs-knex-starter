import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiException } from 'src/exceptions';
import { ApiEC } from 'src/exceptions/apiec.enum';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
    handleRequest(err: any, user: any) {
        if (err) {
            throw err instanceof ApiException ? err : new ApiException(ApiEC.IncorrectEmailOrPassword);
        }

        if (!user) {
            throw new ApiException(ApiEC.IncorrectEmailOrPassword);
        }

        return user;
    }
}
