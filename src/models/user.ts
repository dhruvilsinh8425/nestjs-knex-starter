import { AnyQueryBuilder, Model, QueryContext } from 'objection';
import { v4 as uuidv4 } from 'uuid';
import { SessionUserInfo } from 'src/api/auth/dto';
import { AuthType } from 'src/api/auth/enums';
import { commonConstants } from 'src/common/constants';
import { StatusType, UserType } from 'src/common/enums';
import { dbNames } from 'src/db/db.names';
import { Session } from '.';

export class User extends Model {
    id: number;
    auth_type: AuthType;
    user_type: UserType;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    phone?: string | null;
    avatar?: string | null;
    is_phone_verified: boolean;
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
                user_type: { enum: Object.values(UserType) },
                first_name: { type: ['null', 'string'] },
                last_name: { type: ['null', 'string'] },
                email: { type: ['null', 'string'] },
                phone: { type: ['null', 'string'] },
                avatar: { type: ['null', 'string'] },
                is_phone_verified: { type: 'boolean' },
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
            userType: this.user_type,
            firstName: this.first_name ?? undefined,
            lastName: this.last_name ?? undefined,
            email: this.email ?? undefined,
            phone: this.phone ?? undefined,
            avatar: this.avatar ?? null,
            sessionToken: this.sessionToken ?? undefined,
            isPhoneVerified: !!this.is_phone_verified,
            status: this.status,
        };
    }
}
