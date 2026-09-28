import { AnyQueryBuilder, Model } from 'objection';
import { FileDataInfo } from 'src/api/common/dto/common.entity';
import { FileDataType } from 'src/api/common/enums';
import { StatusType } from 'src/common/enums';
import { dbNames } from 'src/db/db.names';

export class FileData extends Model {
    id: number;
    user_id?: number | null;
    name?: string | null;
    file_type: FileDataType;
    file_url: string;
    file_key: string;
    mime_type: string;
    size: number;
    width?: number | null;
    height?: number | null;
    thumb_url?: string | null;
    thumb_key?: string | null;
    thumb_mime_type?: string | null;
    status: StatusType;
    created_at?: string;
    updated_at?: string;

    static get tableName() {
        return dbNames.fileData.tableName;
    }

    static get idColumn() {
        return 'id';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['file_type', 'file_url', 'file_key', 'mime_type'],

            properties: {
                id: { type: 'integer' },
                user_id: { type: ['null', 'integer'] },
                name: { type: ['null', 'string'], maxLength: 255 },
                file_type: { enum: Object.values(FileDataType) },
                file_url: { type: 'string', maxLength: 1024 },
                file_key: { type: 'string', maxLength: 512 },
                mime_type: { type: 'string', maxLength: 128 },
                size: { type: 'integer' },
                width: { type: ['null', 'integer'] },
                height: { type: ['null', 'integer'] },
                thumb_url: { type: ['null', 'string'], maxLength: 1024 },
                thumb_key: { type: ['null', 'string'], maxLength: 512 },
                thumb_mime_type: { type: ['null', 'string'], maxLength: 128 },
                status: { enum: Object.values(StatusType), default: StatusType.Active },
            },
        };
    }

    static get modifiers() {
        return {
            active(builder: AnyQueryBuilder) {
                const { ref } = FileData;
                builder.where(ref('status'), StatusType.Active);
            },
        };
    }

    toFileDataInfoDTO(): FileDataInfo {
        return {
            id: this.id,
            name: this.name ?? undefined,
            type: this.file_type,
            fileUrl: this.file_url,
            mimeType: this.mime_type,
            size: this.size,
            width: this.width ?? undefined,
            height: this.height ?? undefined,
            thumbUrl: this.thumb_url ?? undefined,
            thumbMimeType: this.thumb_mime_type ?? undefined,
        };
    }
}
