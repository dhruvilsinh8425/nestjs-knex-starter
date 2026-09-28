import { errorTranslate, errorTranslateTitle, errorTranslateModule } from './dict.exception';
import { ApiErrorResponse } from './dto';
import { ApiEC } from './apiec.enum';

export class ApiException extends Error {
    private readonly errorCode: ApiEC;
    private readonly errorTitle?: string;
    private readonly errorType?: string;

    constructor(errorCode: ApiEC, message?: string, title?: string, type?: string) {
        super(message ?? ApiException.defaultMessageKeyForErrorCode(errorCode));
        this.errorCode = errorCode;
        this.errorTitle = title;
        this.errorType = type;
    }

    toErrorDTO(): ApiErrorResponse {
        const title =
            this.errorTitle ?? errorTranslateTitle(ApiException.defaultMessageKeyForErrorCode(this.errorCode));
        const body = this.message; // ?? ApiException.bodyForErrorCode(this.errorCode);
        return {
            errorCode: this.errorCode,
            title: title ? errorTranslate(title) : undefined,
            message: errorTranslate(body),
            type:
                this.errorType ??
                errorTranslateModule(ApiException.defaultMessageKeyForErrorCode(this.errorCode)) ??
                'api',
            isForceLogout: ApiException.isForceLogoutErrorCode(this.errorCode),
        };
    }

    private static isForceLogoutErrorCode(errorCode: ApiEC): boolean {
        return errorCode === ApiEC.AccessDenied;
    }

    private static defaultMessageKeyForErrorCode(errorCode: ApiEC): string {
        switch (errorCode) {
            case ApiEC.InternalServerError:
                return 'API_ERROR_INTERNAL_SERVER_ERROR';
            case ApiEC.TooManyRequests:
                return 'API_ERROR_TOO_MANY_REQUESTS';
            case ApiEC.WrongAppKey:
                return 'API_ERROR_WRONG_APP_KEY';
            case ApiEC.AccessDenied:
                return 'API_ERROR_ACCESS_DENIED';
            case ApiEC.WrongInput:
                return 'API_ERROR_WRONG_INPUT';
            case ApiEC.InvalidRequest:
                return 'API_ERROR_INVALID_REQUEST';
            case ApiEC.OTPCodeExpired:
                return 'API_ERROR_OTP_CODE_EXPIRED';
            case ApiEC.EmailAlreadyVerified:
                return 'API_ERROR_EMAIL_ALREADY_VERIFIED';
            case ApiEC.UserEmailIsNotVerified:
                return 'API_ERROR_USER_EMAIL_IS_NOT_VERIFIED';
            case ApiEC.UserPhoneIsNotVerified:
                return 'API_ERROR_USER_PHONE_IS_NOT_VERIFIED';
            case ApiEC.UnsupportedAppVersion:
                return 'API_ERROR_UNSUPPORTED_APP_VERSION';
            case ApiEC.UserNotFound:
                return 'API_ERROR_USER_NOT_FOUND';
            case ApiEC.EmailAlreadyExist:
                return 'API_ERROR_EMAIL_ALREADY_EXIST';
            case ApiEC.ImageFileRequired:
                return 'API_ERROR_IMAGE_FILE_REQUIRED';
            case ApiEC.WrongImageFormat:
                return 'API_ERROR_WRONG_IMAGE_FORMAT';
            case ApiEC.FileTooLarge:
                return 'API_ERROR_FILE_TOO_LARGE';
            case ApiEC.FileDataRequired:
                return 'API_ERROR_FILE_DATA_REQUIRED';
            case ApiEC.UnsupportedFileType:
                return 'API_ERROR_UNSUPPORTED_FILE_TYPE';
            case ApiEC.AccountInactive:
                return 'API_ERROR_ACCOUNT_INACTIVE';
            case ApiEC.ServiceUnavailable:
                return 'API_ERROR_SERVICE_UNAVAILABLE';
            case ApiEC.IncorrectEmailOrPassword:
                return 'API_ERROR_INCORRECT_EMAIL_OR_PASSWORD';
            case ApiEC.PasswordRecoveryTokenExpired:
                return 'API_ERROR_PASSWORD_RECOVERY_TOKEN_EXPIRED';
            case ApiEC.InvalidSocialToken:
                return 'API_ERROR_INVALID_SOCIAL_TOKEN';
            case ApiEC.PhoneOrEmailRequired:
                return 'API_ERROR_PHONE_OR_EMAIL_REQUIRED';
            case ApiEC.UserNotFoundByEmail:
                return 'API_ERROR_USER_NOT_FOUND_BY_EMAIL';
            case ApiEC.UserNotFoundByPhone:
                return 'API_ERROR_USER_NOT_FOUND_BY_PHONE';
            case ApiEC.PhoneAlreadyExist:
            case ApiEC.PhoneAlreadyRegistered:
                return 'API_ERROR_PHONE_ALREADY_EXIST';
            case ApiEC.PhoneAlreadyVerified:
                return 'API_ERROR_PHONE_ALREADY_VERIFIED';
            case ApiEC.WrongInputPhone:
                return 'API_ERROR_WRONG_INPUT_PHONE';
            case ApiEC.PhoneNumberWrong:
                return 'API_ERROR_PHONE_NUMBER_WRONG';
            case ApiEC.PleaseAddValidPhoneNo:
                return 'API_ERROR_PLEASE_ADD_VALID_PHONE_NUMBER';
        }

        return '';
    }
}
