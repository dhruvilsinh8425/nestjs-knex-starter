import { Body, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBadRequestResponse, ApiConsumes, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiException } from 'src/exceptions';
import { ApiEC } from 'src/exceptions/apiec.enum';
import { ApiErrorResponse } from 'src/exceptions/dto';
import { allowedMimeTypes, storageConstants } from 'src/services/storage';
import { UserPassport } from '../auth/decorators';
import { SessionUserInfo } from '../auth/dto';
import { JwtAuthGuard } from '../auth/guards';
import { CommonService } from './common.service';
import { FileDataRequest, FileDataResponse } from './dto';

@ApiSecurity('X_API_KEY')
@ApiTags('Common')
@ApiBadRequestResponse({
    description: 'Bad response',
    type: ApiErrorResponse,
})
@Controller('common')
export class CommonController {
    constructor(private readonly commonService: CommonService) {}

    @Post('file-data')
    @ApiSecurity('X_SESSION_KEY')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Upload a file (images get a thumbnail), max 10 MB' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FileInterceptor('file', {
            limits: { fileSize: storageConstants.maxFileSizeBytes, files: 1 },
            fileFilter: (_req, file, callback) => {
                const isAllowed = allowedMimeTypes.some((pattern) => pattern.test(file.mimetype));
                callback(isAllowed ? null : new ApiException(ApiEC.UnsupportedFileType), isAllowed);
            },
        })
    )
    async createFileData(
        @UserPassport() sessionUser: SessionUserInfo,
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: FileDataRequest
    ): Promise<FileDataResponse> {
        return this.commonService.createFileData(sessionUser, file, dto);
    }
}
