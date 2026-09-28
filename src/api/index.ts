import { Type } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { UserModule } from './user/user.module';

export const ApiModulesList: Array<Type<any>> = [AuthModule, UserModule, CommonModule];
