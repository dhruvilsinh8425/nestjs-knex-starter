import { Model } from 'objection';
import { ZReqLogType } from 'src/common/enums';
import { dbNames } from 'src/db/db.names';

export class ZRequestLog extends Model {
    id: number;
    user_id?: number | null;
    type: ZReqLogType;
    method: string;
    route: string;
    headers?: string | null;
    get?: string | null;
    post?: string | null;
    status_code?: string | null;
    response?: string | null;
    duration_ms?: number | null;
    created_at?: string;

    static get tableName() {
        return dbNames.zRequestLogs.tableName;
    }

    static get idColumn() {
        return 'id';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['type', 'method', 'route'],

            properties: {
                id: { type: 'integer' },
                user_id: { type: ['integer', 'null'] },
                type: { enum: Object.values(ZReqLogType) },
                method: { type: 'string', maxLength: 10 },
                route: { type: 'string', maxLength: 1024 },
                headers: { type: ['string', 'null'] },
                get: { type: ['string', 'null'] },
                post: { type: ['string', 'null'] },
                status_code: { type: ['string', 'null'], maxLength: 5 },
                response: { type: ['string', 'null'] },
                duration_ms: { type: ['integer', 'null'] },
            },
        };
    }
}
