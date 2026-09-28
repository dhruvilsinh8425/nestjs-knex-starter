import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { Injectable } from '@nestjs/common';
import { ApiException } from 'src/exceptions';
import { ApiEC } from 'src/exceptions/apiec.enum';
import { Creds } from 'src/models';

const scrypt = promisify(scryptCallback) as (password: string, salt: string, keylen: number) => Promise<Buffer>;
const keyLength = 64;

@Injectable()
export class CredsService {
    async hashPassword(password: string): Promise<{ hash: string; salt: string }> {
        const salt = randomBytes(16).toString('hex');
        const hash = (await scrypt(password, salt, keyLength)).toString('hex');

        return { hash, salt };
    }

    async isPasswordMatch(password: string, hash: string, salt: string): Promise<boolean> {
        const expected = Buffer.from(hash, 'hex');
        const actual = await scrypt(password, salt, expected.length || keyLength);

        return expected.length === actual.length && timingSafeEqual(expected, actual);
    }

    async setCredentialsForUser(userId: number, password: string, trx?: any): Promise<void> {
        if (!userId || !password) {
            throw new ApiException(ApiEC.WrongInput);
        }

        const { hash, salt } = await this.hashPassword(password);

        await Creds.query(trx).insert({ user_id: userId, hash, salt }).onConflict('user_id').merge(['hash', 'salt']);
    }

    async checkCredentials(userId: number, password: string): Promise<boolean> {
        if (!userId || !password) {
            return false;
        }

        const credential = await Creds.query().findOne({ user_id: userId });
        if (!credential) {
            return false;
        }

        return this.isPasswordMatch(password, credential.hash, credential.salt);
    }

    async hasCredentials(userId: number): Promise<boolean> {
        return !!(await Creds.query().findOne({ user_id: userId }));
    }
}
