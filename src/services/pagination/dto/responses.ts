import { PageInfo } from '.';

export class PageInfoResponse {
    currentPage: number;
    perPage: number;
    totalPages: number;
    totalItems: number;
}

export class PageInfoTotalResponse extends PageInfo {
    total?: number;
}
