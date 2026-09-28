export enum CronTaskType {
    QuoteReqPublished = 'QUOTE_REQ_PUBLISHED',
    QuoteReqConfirmed = 'QUOTE_REQ_CONFIRMED',
    QuoteReqUpdated = 'QUOTE_REQ_UPDATED',
}

export enum CronTaskStatusType {
    Pending = 'PENDING',
    Processing = 'PROCESSING',
    Completed = 'COMPLETED',
    Deleted = 'DELETED',
}
