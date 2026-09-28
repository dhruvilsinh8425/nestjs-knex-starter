import { AnyQueryBuilder, Model } from 'objection';
import { StatusType } from 'src/common/enums';
import { commonConstants } from 'src/common/constants';
import { DeviceType } from 'src/api/auth/enums';
import { dbNames } from '../db/db.names';
import { User } from '.';

export class Session extends Model {
    id: number;
    user_id?: number | null;
    device_id?: string | null;
    fcm_token?: string | null;
    device_type?: DeviceType | null;
    token: string;
    expired_at: string;
    last_use_at?: string | null;
    status: StatusType;
    created_at?: string;
    updated_at?: string;

    user?: User;

    static get tableName() {
        return dbNames.sessions.tableName;
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
                user_id: { type: ['null', 'integer'] },
                device_id: { type: ['null', 'string'], maxLength: commonConstants.maxDefaultStringLength },
                fcm_token: { type: ['null', 'string'], maxLength: commonConstants.maxDefaultStringLength },
                device_type: { enum: [...Object.values(DeviceType), null] },
                token: { type: 'string', maxLength: commonConstants.maxTokenLength },
                expired_at: { type: 'string' },
                last_use_at: { type: ['null', 'string'] },
                status: { enum: Object.values(StatusType), default: StatusType.Active },
            },
        };
    }

    static get relationMappings(): Record<string, any> {
        return {
            user: {
                relation: Model.HasOneRelation,
                modelClass: User,
                join: {
                    from: `${dbNames.sessions.tableName}.user_id`,
                    to: `${dbNames.users.tableName}.id`,
                },
            },
        };
    }

    static get modifiers() {
        return {
            active(builder: AnyQueryBuilder) {
                const { ref, fn } = Session;
                builder.where(ref('status'), StatusType.Active);
                builder.where(ref('expired_at'), '>', fn.now());
            },
        };
    }
}
