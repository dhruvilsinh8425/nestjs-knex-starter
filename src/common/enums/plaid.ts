export enum BackgroundCheckStatusType {
    Pending = 'PENDING',
    PaymentProcessing = 'PAYMENT_PROCESSING',
    PaymentPaid = 'PAYMENT_PAID',
    PaymentFailed = 'PAYMENT_FAILED',
    Connected = 'CONNECTED',
    Expired = 'EXPIRED',
    Deleted = 'DELETED',
}

export enum BgCheckDocType {
    Asset = 'ASSET',
    Income = 'INCOME',
    Transaction = 'TRANSACTION',
}

export enum AppType {
    Plaid = 'PLAID',
    Equifax = 'EQUIFAX',
    Stripe = 'STRIPE',
}

export enum ReportStatusType {
    Pending = 'PENDING',
    Generated = 'GENERATED',
    Failed = 'FAILED',
}
