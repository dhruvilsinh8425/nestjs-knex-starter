export enum InvoiceStatusType {
    Pending = 'PENDING',
    Processing = 'PROCESSING',
    PartiallyPaid = 'PARTIALLY_PAID',
    Paid = 'PAID',
    Failed = 'FAILED',
    Deleted = 'DELETED',
}

export enum DataType {
    BackgroundCheck = 'BACKGROUND_CHECK',
    Deposit = 'DEPOSIT',
    Fees = 'FEES',
    InvoicePayment = 'INVOICE_PAYMENT',
}

export enum TenantAppBalanceDataType {
    Payment = 'PAYMENT',
    Charge = 'CHARGE',
}

export enum TenantAppBalanceStatusType {
    Pending = 'PENDING',
    Processing = 'PROCESSING',
    Charged = 'CHARGED',
    Paid = 'PAID',
    Failed = 'FAILED',
    Canceled = 'CANCELED',
    Deleted = 'DELETED',
}
