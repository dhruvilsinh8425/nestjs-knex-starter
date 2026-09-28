import { isArray } from 'lodash';
import { ArgumentsHost, Catch, ExceptionFilter, Logger, PayloadTooLargeException } from '@nestjs/common';
import { Response, Request } from 'express';
import { ValidationError } from 'class-validator';
import { ApiException } from '.';
import { ApiEC } from './apiec.enum';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private logger: Logger;
    constructor() {
        this.logger = new Logger('ApiException');
    }
    catch(exception: Error | Error[], host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response: Response = ctx.getResponse<Response>();
        const request: Request = ctx.getRequest<Request>();

        if (exception instanceof Error && exception?.stack) {
            this.logger.error(exception.stack);
        }

        this.logger.error(
            `Route error: ${JSON.stringify(exception)}, originalUrl: ${request.url}, ips:[${
                request?.ips?.length ? request?.ips : request.ip
            }]`
        );

        let apiException: ApiException;

        if (exception instanceof PayloadTooLargeException) {
            if (exception?.message === 'File too large') {
                exception = new ApiException(ApiEC.FileTooLarge);
            }
        }

        if (exception instanceof ApiException) {
            apiException = exception;
        } else if (isArray(exception)) {
            const validationErrorConstraints: Array<string> = [];

            const fillUpErrorConstraints = (item: any): any => {
                if (item instanceof ValidationError && item?.children?.length) {
                    for (const kid of item.children) {
                        if (kid instanceof ValidationError && kid?.children?.length) {
                            return fillUpErrorConstraints(kid);
                        }
                        if ('constraints' in kid) {
                            validationErrorConstraints.push(...Object.values(kid.constraints!));
                        }
                    }
                }
            };

            for (const item of exception as Error[]) {
                if (item instanceof ValidationError) {
                    if ('constraints' in item) {
                        validationErrorConstraints.push(...Object.values(item.constraints!));
                    }

                    if (item?.children?.length) {
                        fillUpErrorConstraints(item);
                    }
                }
            }
            const validateErrorMsg =
                validationErrorConstraints?.length && validationErrorConstraints[0].startsWith('API_')
                    ? validationErrorConstraints[0]
                    : undefined;
            apiException = new ApiException(ApiEC.WrongInput, validateErrorMsg);
        } else if ('errorCode' in exception) {
            const { errorCode, message } = exception as any;
            apiException = new ApiException(errorCode, message);
        } else {
            apiException = new ApiException(ApiEC.InternalServerError);
        }

        const errorResponseDTO = apiException.toErrorDTO();
        const status = errorResponseDTO.errorCode === ApiEC.TooManyRequests ? 429 : 400;

        if (exception instanceof ApiException || process.env.NODE_ENV === 'production') {
            response.status(status).json(errorResponseDTO);
        } else {
            response.status(status).json({ ...errorResponseDTO, exception });
        }
    }
}
