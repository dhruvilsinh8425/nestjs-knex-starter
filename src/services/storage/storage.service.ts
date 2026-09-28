import { randomUUID } from 'crypto';
import { mkdir, rm, writeFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import sharp from 'sharp';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StoredFile, UploadFileRequest } from './dto';
import { storageConstants, uploadFolders } from './storage.constants';

/**
 * Stores files in S3 when AWS_S3_BUCKET is set, otherwise in `public/uploads` (served by the API).
 */
@Injectable()
export class StorageService {
    private readonly logger = new Logger(StorageService.name);
    private readonly bucket: string;
    private readonly region: string;
    private readonly publicBaseUrl: string;
    private readonly s3Client?: S3Client;

    constructor(private readonly configService: ConfigService) {
        this.bucket = this.configService.get<string>('AWS_S3_BUCKET', '');
        this.region = this.configService.get<string>('AWS_REGION', '');

        if (this.bucket) {
            const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID', '');
            const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY', '');

            this.s3Client = new S3Client({
                region: this.region,
                // Without keys the SDK falls back to the default chain (IAM role, env, profile)
                credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
            });

            const cloudFrontUrl = this.configService.get<string>('CLOUD_FRONT_BUCKET_URL', '').replace(/['"]/g, '');
            this.publicBaseUrl = cloudFrontUrl || `https://${this.bucket}.s3.${this.region}.amazonaws.com`;
        } else {
            const apiDomain = this.configService.get<string>('API_DOMAIN', '');
            this.publicBaseUrl = `${apiDomain}/${storageConstants.localFolder}`;
            this.logger.warn('AWS_S3_BUCKET is not set: uploads are stored in public/uploads');
        }
    }

    get isS3(): boolean {
        return !!this.s3Client;
    }

    async uploadFile({
        buffer,
        mimeType,
        folder,
        extension,
        isPrivate = false,
    }: UploadFileRequest): Promise<StoredFile> {
        const key = `${folder}/${randomUUID()}${extension ? `.${extension}` : ''}`;

        if (this.s3Client) {
            await this.s3Client.send(
                new PutObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                    Body: buffer,
                    ContentType: mimeType,
                    ...(isPrivate ? {} : { ACL: 'public-read' as const }),
                })
            );
        } else {
            const filePath = this.localPath(key);
            await mkdir(dirname(filePath), { recursive: true });
            await writeFile(filePath, buffer);
        }

        return { key, url: `${this.publicBaseUrl}/${key}`, mimeType };
    }

    async createThumbnail(
        buffer: Buffer,
        size: number = storageConstants.thumbnailSize
    ): Promise<StoredFile & { width: number; height: number }> {
        const { data, info } = await sharp(buffer)
            .rotate()
            .resize(size, size, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer({ resolveWithObject: true });

        const stored = await this.uploadFile({
            buffer: data,
            mimeType: 'image/webp',
            folder: uploadFolders.thumbnails,
            extension: 'webp',
        });

        return { ...stored, width: info.width, height: info.height };
    }

    async deleteFile(key?: string | null): Promise<void> {
        if (!key) {
            return;
        }

        try {
            if (this.s3Client) {
                await this.s3Client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
            } else {
                await rm(this.localPath(key), { force: true });
            }
        } catch (err) {
            this.logger.error(`Failed to delete ${key}: ${err?.message}`);
        }
    }

    private localPath(key: string): string {
        const root = resolve(storageConstants.localRoot, storageConstants.localFolder);
        const filePath = resolve(root, key);

        if (!filePath.startsWith(root)) {
            throw new Error('Invalid file key');
        }

        return filePath;
    }
}
