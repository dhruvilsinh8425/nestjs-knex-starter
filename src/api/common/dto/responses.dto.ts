import { ApiProperty } from '@nestjs/swagger';
import { FileDataInfo } from './common.entity';

export class FileDataResponse {
    @ApiProperty({ type: () => FileDataInfo })
    data: FileDataInfo;
}
