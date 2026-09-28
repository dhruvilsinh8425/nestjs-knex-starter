import { AnyQueryBuilder, Model } from 'objection';
import { StatusType } from 'src/common/enums';
import { dbNames } from 'src/db/db.names';

export class ResetToken extends Model {
    id: number;
    user_id: number;
    token: string;
    expired_at: string;
    status: StatusType;
    created_at?: string;
    updated_at?: string;

    static get tableName() {
        return dbNames.resetTokens.tableName;
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
                user_id: { type: 'integer' },
                token: { type: 'string', maxLength: 255 },
                expired_at: { type: 'string' },
                status: { enum: Object.values(StatusType), default: StatusType.Active },
            },
        };
    }

    static get modifiers() {
        return {
            active(builder: AnyQueryBuilder) {
                const { ref, fn } = ResetToken;
                builder.where(ref('status'), StatusType.Active);
                builder.where(ref('expired_at'), '>', fn.now());
            },
        };
    }
}
