import { Model } from 'objection';
import { dbNames } from 'src/db/db.names';

export class Creds extends Model {
    id: number;
    user_id: number;
    hash: string;
    salt: string;
    created_at?: string;
    updated_at?: string;

    static get tableName() {
        return dbNames.creds.tableName;
    }

    static get idColumn() {
        return 'id';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['user_id', 'hash', 'salt'],

            properties: {
                id: { type: 'integer' },
                user_id: { type: 'integer' },
                hash: { type: 'string', maxLength: 255 },
                salt: { type: 'string', maxLength: 64 },
            },
        };
    }
}
