import { AnyQueryBuilder, Model } from 'objection';
import { StatusType } from 'src/common/enums';
import { dbNames } from 'src/db/db.names';
import { OtpType } from 'src/services/otp/enums';

export class Otp extends Model {
    id: number;
    channel: string;
    code: string;
    otp_type: OtpType;
    expired_at: string;
    sent_at?: string | null;
    sent_counter: number;
    status: StatusType;
    created_at?: string;
    updated_at?: string;

    static get tableName() {
        return dbNames.otps.tableName;
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
                channel: { type: 'string', maxLength: 255 },
                code: { type: 'string', maxLength: 10 },
                otp_type: { enum: Object.values(OtpType), default: OtpType.VerifyPhone },
                expired_at: { type: 'string' },
                sent_at: { type: ['null', 'string'] },
                sent_counter: { type: 'number' },
                status: { enum: Object.values(StatusType), default: StatusType.Active },
            },
        };
    }

    static get modifiers() {
        return {
            active(builder: AnyQueryBuilder) {
                const { ref } = Otp;
                builder.where(ref('status'), StatusType.Active);
            },
        };
    }
}
