import { extname } from 'path';
import sharp from 'sharp';
import { Injectable, Logger } from '@nestjs/common';
import { StatusType } from 'src/common/enums';
import { ApiException } from 'src/exceptions';
import { ApiEC } from 'src/exceptions/apiec.enum';
import { FileData } from 'src/models';
import { StorageService, StoredFile, uploadFolders } from 'src/services/storage';
import { SessionUserInfo } from '../auth/dto';
import { FileDataRequest, FileDataResponse } from './dto';
import { FileDataType } from './enums';

const folderByType: Record<FileDataType, string> = {
    [FileDataType.Image]: uploadFolders.images,
    [FileDataType.Video]: uploadFolders.videos,
    [FileDataType.Document]: uploadFolders.documents,
    [FileDataType.Other]: uploadFolders.files,
};

@Injectable()
export class CommonService {
    private readonly logger = new Logger(CommonService.name);

    constructor(private readonly storageService: StorageService) {}

    async createFileData(
        sessionUser: SessionUserInfo,
        file: Express.Multer.File,
        { name, type }: FileDataRequest
    ): Promise<FileDataResponse> {
        if (!file?.buffer?.length) {
            throw new ApiException(ApiEC.FileDataRequired);
        }

        const isImage = file.mimetype.startsWith('image/');
        const fileType = type ?? CommonService.detectType(file.mimetype);
        if (fileType === FileDataType.Image && !isImage) {
            throw new ApiException(ApiEC.WrongImageFormat);
        }

        const extension = extname(file.originalname).replace('.', '').toLowerCase().slice(0, 10);
        const uploaded: StoredFile[] = [];

        try {
            const stored = await this.storageService.uploadFile({
                buffer: file.buffer,
                mimeType: file.mimetype,
                folder: folderByType[fileType],
                extension: /^[a-z0-9]+$/.test(extension) ? extension : undefined,
            });
            uploaded.push(stored);

            const metadata = isImage ? await sharp(file.buffer).metadata() : null;
            const thumbnail = isImage ? await this.storageService.createThumbnail(file.buffer) : null;
            thumbnail && uploaded.push(thumbnail);

            const fileData = await FileData.query().insertAndFetch({
                user_id: sessionUser.id,
                name: (name || file.originalname || '').slice(0, 255) || null,
                file_type: fileType,
                file_url: stored.url,
                file_key: stored.key,
                mime_type: file.mimetype,
                size: file.size,
                width: metadata?.autoOrient?.width ?? metadata?.width ?? null,
                height: metadata?.autoOrient?.height ?? metadata?.height ?? null,
                thumb_url: thumbnail?.url ?? null,
                thumb_key: thumbnail?.key ?? null,
                thumb_mime_type: thumbnail?.mimeType ?? null,
                status: StatusType.Active,
            });

            return { data: fileData.toFileDataInfoDTO() };
        } catch (err) {
            await Promise.all(uploaded.map(({ key }) => this.storageService.deleteFile(key)));

            if (err instanceof ApiException) {
                throw err;
            }

            this.logger.error(`File upload failed: ${err?.message}`);
            throw new ApiException(isImage ? ApiEC.WrongImageFormat : ApiEC.InternalServerError);
        }
    }

    private static detectType(mimeType: string): FileDataType {
        if (mimeType.startsWith('image/')) {
            return FileDataType.Image;
        }
        if (mimeType.startsWith('video/')) {
            return FileDataType.Video;
        }
        if (mimeType.startsWith('application/') || mimeType.startsWith('text/')) {
            return FileDataType.Document;
        }
        return FileDataType.Other;
    }
}
