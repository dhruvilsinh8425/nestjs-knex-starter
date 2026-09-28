import { ApiProperty } from '@nestjs/swagger';
import { FileDataType } from '../enums';

export class FileDataInfo {
    @ApiProperty()
    id: number;

    @ApiProperty({ required: false })
    name?: string;

    @ApiProperty({ enum: FileDataType })
    type: FileDataType;

    @ApiProperty()
    fileUrl: string;

    @ApiProperty()
    mimeType: string;

    @ApiProperty({ description: 'Size in bytes' })
    size: number;

    @ApiProperty({ required: false })
    width?: number;

    @ApiProperty({ required: false })
    height?: number;

    @ApiProperty({ required: false, description: 'Generated for images only' })
    thumbUrl?: string;

    @ApiProperty({ required: false })
    thumbMimeType?: string;
}
