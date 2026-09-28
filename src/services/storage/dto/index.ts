export class StoredFile {
    key: string;
    url: string;
    mimeType: string;
}

export class UploadFileRequest {
    buffer: Buffer;
    mimeType: string;
    folder: string;
    extension?: string;
    isPrivate?: boolean;
}
