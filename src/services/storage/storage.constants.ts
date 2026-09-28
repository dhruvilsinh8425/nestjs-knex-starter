export const storageConstants = {
    maxFileSizeBytes: 10 * 1024 * 1024,
    thumbnailSize: 500,
    localRoot: 'public',
    localFolder: 'uploads',
};

export const uploadFolders = {
    images: 'images',
    thumbnails: 'thumbnails',
    videos: 'videos',
    documents: 'documents',
    files: 'files',
};

export const allowedMimeTypes: RegExp[] = [
    /^image\/(jpeg|png|webp|gif|heic|heif)$/,
    /^video\/(mp4|quicktime|webm)$/,
    /^application\/pdf$/,
    /^application\/(msword|vnd\.openxmlformats-officedocument\.(wordprocessingml\.document|spreadsheetml\.sheet))$/,
    /^application\/vnd\.ms-excel$/,
    /^text\/(plain|csv)$/,
];
