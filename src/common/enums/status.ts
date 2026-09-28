export enum StatusType {
    New = 'NEW',
    Active = 'ACTIVE',
    Disabled = 'DISABLED',
    Deleted = 'DELETED',
}

export enum RentPaymentLogStatusType {
    Initiated = 'INITIATED',
    Processing = 'PROCESSING',
    Succeeded = 'SUCCEEDED',
    Failed = 'FAILED',
    Deleted = 'DELETED',
}

export enum CvcCheckStatusType {
    Pass = 'PASS',
    Fail = 'FAIL',
    Unavailable = 'UNAVAILABLE',
    Unchecked = 'UNCHECKED',
}
