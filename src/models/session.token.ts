import { AnyQueryBuilder, Model } from 'objection';
import { StatusType } from '../common/enums';
import { dbNames } from '../db/db.names';

export class SessionToken extends Model {
    id: number;
    user_id: number;
    token: string;
    expired_at: string;
    status: StatusType;
    created_at?: string;
    updated_at?: string;

    static get tableName() {
        return dbNames.sessionTokens.tableName;
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
                user_id: { type: ['integer', 'null'] },
                token: { type: 'string', maxLength: 255 },
                status: { enum: Object.values(StatusType), default: StatusType.Active },
                expired_at: { type: 'string' },
            },
        };
    }

    static get modifiers() {
        return {
            active(builder: AnyQueryBuilder) {
                const { ref, fn } = SessionToken;
                builder.where(ref('status'), StatusType.Active);
                builder.where(ref('expired_at'), '>', fn.now());
            },
        };
    }
}
