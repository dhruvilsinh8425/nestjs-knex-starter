import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { commonConstants } from 'src/common/constants';
import { FileDataType } from '../enums';

export class FileDataRequest {
    @ApiProperty({ type: 'string', format: 'binary' })
    file: Express.Multer.File;

    @ApiProperty({ required: false, description: 'Defaults to the original file name' })
    @IsString()
    @IsOptional()
    @MaxLength(commonConstants.maxStringInputLength)
    name?: string;

    @ApiProperty({ required: false, enum: FileDataType, description: 'Detected from the mime type when omitted' })
    @IsEnum(FileDataType)
    @IsOptional()
    type?: FileDataType;
}
