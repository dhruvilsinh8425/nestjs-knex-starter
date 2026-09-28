import { AnyQueryBuilder, Model } from 'objection';
import { SessionUserInfo } from 'src/api/auth/dto';
import { AuthType } from 'src/api/auth/enums';
import { commonConstants } from 'src/common/constants';
import { StatusType } from 'src/common/enums';
import { dbNames } from 'src/db/db.names';
import { Session } from '.';

export class User extends Model {
    id: number;
    auth_type: AuthType;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    country_code?: string | null;
    phone?: string | null;
    avatar?: string | null;
    is_email_verified: boolean;
    is_phone_verified: boolean;
    social_google_id?: string | null;
    social_apple_id?: string | null;
    status: StatusType;
    created_at?: string;
    updated_at?: string;

    sessionToken?: string;
    session?: Session;

    static get tableName() {
        return dbNames.users.tableName;
    }

    static get idColumn() {
        return 'id';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: [],

            properties: {
                id: { type: 'integer' },
                auth_type: { enum: Object.values(AuthType) },
                first_name: { type: ['null', 'string'] },
                last_name: { type: ['null', 'string'] },
                email: { type: ['null', 'string'] },
                country_code: { type: ['null', 'string'], maxLength: 10 },
                phone: { type: ['null', 'string'], maxLength: 20 },
                avatar: { type: ['null', 'string'] },
                is_email_verified: { type: 'boolean' },
                is_phone_verified: { type: 'boolean' },
                social_google_id: { type: ['null', 'string'], maxLength: 255 },
                social_apple_id: { type: ['null', 'string'], maxLength: 255 },
                status: { enum: Object.values(StatusType), default: StatusType.Active },
            },
        };
    }

    static get relationMappings(): Record<string, any> {
        return {
            session: {
                relation: Model.HasOneRelation,
                modelClass: Session,
                modify: 'active',
                join: {
                    from: `${dbNames.users.tableName}.id`,
                    to: `${dbNames.sessions.tableName}.user_id`,
                },
            },
        };
    }

    static get modifiers() {
        return {
            exist(builder: AnyQueryBuilder) {
                const { ref } = User;
                builder.whereIn(ref('status'), [StatusType.New, StatusType.Active, StatusType.Disabled]);
            },
            new(builder: AnyQueryBuilder) {
                const { ref } = User;
                builder.where(ref('status'), StatusType.New);
            },
            newActive(builder: AnyQueryBuilder) {
                const { ref } = User;
                builder.whereIn(ref('status'), [StatusType.New, StatusType.Active]);
            },
            active(builder: AnyQueryBuilder) {
                const { ref } = User;
                builder.where(ref('status'), StatusType.Active);
            },
        };
    }

    isVerified(): boolean {
        return !!this.is_email_verified || !!this.is_phone_verified || this.auth_type === AuthType.Apple;
    }

    fullName(): string {
        const fullName: string[] = [];

        if (this.first_name) {
            fullName.push(this.first_name);
        }

        if (this.last_name) {
            fullName.push(this.last_name);
        }

        return fullName.length ? fullName.join(' ') : commonConstants.defaultUserName;
    }

    toSessionUserInfoDTO(): SessionUserInfo {
        return {
            id: this.id,
            authType: this.auth_type,
            firstName: this.first_name ?? undefined,
            lastName: this.last_name ?? undefined,
            email: this.email ?? undefined,
            countryCode: this.country_code ?? undefined,
            phone: this.phone ?? undefined,
            avatar: this.avatar ?? null,
            sessionToken: this.sessionToken ?? undefined,
            isEmailVerified: !!this.is_email_verified,
            isPhoneVerified: !!this.is_phone_verified,
            status: this.status,
        };
    }
}
