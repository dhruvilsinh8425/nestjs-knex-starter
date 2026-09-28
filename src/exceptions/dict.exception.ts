export function errorTranslate(key: string): string {
    if (errorText[key]) {
        const value = errorText[key];
        return typeof value === 'string' ? value : value.message;
    } else {
        return key;
    }
}

export function errorTranslateTitle(key: string): string | undefined {
    if (errorText[key]) {
        const value = errorText[key];
        return typeof value === 'object' ? value.title : undefined;
    }
    return undefined;
}

export function errorTranslateModule(key: string): string | undefined {
    if (errorText[key]) {
        const value = errorText[key];
        return typeof value === 'object' ? value.module : undefined;
    }
    return undefined;
}

export function errorTranslateAlertType(key: string): 'alert' | 'toast' {
    if (errorText[key]) {
        const value = errorText[key];
        return value.alertType || 'alert';
    }
    return 'alert';
}

export const errorText: Record<
    string,
    { message: string; title: string; module: string; alertType?: 'alert' | 'toast' }
> = {
    // 1. Authentication & Authorization
    API_ERROR_ACCESS_DENIED: {
        message: 'Access denied.',
        title: 'Access Error',
        module: 'auth',
        alertType: 'alert',
    },
    API_ERROR_WRONG_APP_KEY: {
        message: 'Wrong API app key.',
        title: 'Authentication Error',
        module: 'auth',
        alertType: 'alert',
    },
    API_ERROR_USER_PHONE_IS_NOT_VERIFIED: {
        message: 'You should verify your phone first.',
        title: 'Verification Error',
        module: 'verification',
        alertType: 'alert',
    },
    API_ERROR_USER_EMAIL_IS_NOT_VERIFIED: {
        message: 'You should verify your email first.',
        title: 'Verification Error',
        module: 'verification',
        alertType: 'alert',
    },
    API_ERROR_EMAIL_ALREADY_VERIFIED: {
        message: 'Your email is already verified.',
        title: 'Verification Error',
        module: 'verification',
        alertType: 'alert',
    },
    API_ERROR_PHONE_ALREADY_VERIFIED: {
        message: 'Your phone number is already verified.',
        title: 'Verification Error',
        module: 'verification',
        alertType: 'alert',
    },
    API_ERROR_UNSUPPORTED_APP_VERSION: {
        message: 'Please update the app to continue.',
        title: 'Update Required',
        module: 'app',
        alertType: 'alert',
    },
    API_ERROR_INCORRECT_EMAIL_OR_PASSWORD: {
        message: 'Incorrect email or password.',
        title: 'Sign In Error',
        module: 'auth',
        alertType: 'alert',
    },
    API_ERROR_PASSWORD_RECOVERY_TOKEN_EXPIRED: {
        message: 'Your password reset request has expired. Please request a new code.',
        title: 'Reset Password Error',
        module: 'auth',
        alertType: 'alert',
    },
    API_ERROR_INVALID_SOCIAL_TOKEN: {
        message: 'Could not verify your social account. Please try again.',
        title: 'Sign In Error',
        module: 'auth',
        alertType: 'alert',
    },
    API_ERROR_OTP_CODE_EXPIRED: {
        message: '6-digit code is incorrect or has expired. Please try to retype or resend the code.',
        title: 'OTP Error',
        module: 'otp',
        alertType: 'alert',
    },

    // 2. Validation/Input
    API_ERROR_INCORRECT_INPUT_DATA: {
        message: 'Please check the entered data.',
        title: 'Validation Error',
        module: 'validation',
        alertType: 'alert',
    },
    API_ERROR_WRONG_INPUT: {
        message: 'Wrong input data.',
        title: 'Validation Error',
        module: 'validation',
        alertType: 'alert',
    },
    API_ERROR_WRONG_INPUT_PHONE: {
        message: 'Enter valid phone number in the international format (ex. +11234567890).',
        title: 'Validation Error',
        module: 'validation',
        alertType: 'alert',
    },
    API_ERROR_PHONE_NUMBER_WRONG: {
        message: 'Phone must be a valid phone number.',
        title: 'Validation Error',
        module: 'validation',
        alertType: 'alert',
    },
    API_ERROR_PHONE_OR_EMAIL_REQUIRED: {
        message: 'Please enter an email or a phone number.',
        title: 'Validation Error',
        module: 'validation',
        alertType: 'alert',
    },
    API_ERROR_WRONG_INPUT_PASSWORD: {
        message: 'Password must be at least 8 characters and include upper case, lower case and a number.',
        title: 'Validation Error',
        module: 'validation',
        alertType: 'alert',
    },
    API_ERROR_WRONG_INPUT_EMAIL: {
        message: 'Please enter a valid email address.',
        title: 'Validation Error',
        module: 'validation',
        alertType: 'alert',
    },
    API_ERROR_PLEASE_ADD_VALID_PHONE_NUMBER: {
        message: 'Please add valid US phone number',
        title: 'Validation Error',
        module: 'validation',
        alertType: 'alert',
    },

    // 3. User/Account
    API_ERROR_USER_NOT_FOUND_BY_PHONE: {
        message: 'This phone is not registered. Please try another one.',
        title: 'User Error',
        module: 'user',
        alertType: 'alert',
    },
    API_ERROR_USER_NOT_FOUND_BY_EMAIL: {
        message: 'This email is not registered. Please try another one or create an account.',
        title: 'User Error',
        module: 'user',
        alertType: 'alert',
    },
    API_ERROR_USER_NOT_FOUND: {
        message: 'This email is not registered. Please try another one or Create an account.',
        title: 'User Error',
        module: 'user',
        alertType: 'alert',
    },
    API_ERROR_ACCOUNT_INACTIVE: {
        message: 'This account is no longer active.',
        title: 'Account Error',
        module: 'user',
        alertType: 'alert',
    },
    API_ERROR_EMAIL_ALREADY_EXIST: {
        message: 'This email is already registered.',
        title: 'Account Error',
        module: 'user',
        alertType: 'alert',
    },
    API_ERROR_PHONE_ALREADY_EXIST: {
        message: 'This phone number is already registered.',
        title: 'Account Error',
        module: 'user',
        alertType: 'alert',
    },

    // 4. File/Media
    API_ERROR_IMAGE_FILE_REQUIRED: {
        message: 'Please select an image file.',
        title: 'File Error',
        module: 'file',
        alertType: 'alert',
    },
    API_ERROR_WRONG_IMAGE_FORMAT: {
        message: 'Please upload a valid image (JPG, PNG, WEBP, GIF or HEIC).',
        title: 'File Error',
        module: 'file',
        alertType: 'alert',
    },
    API_ERROR_UNSUPPORTED_FILE_TYPE: {
        message: 'This file type is not supported.',
        title: 'File Error',
        module: 'file',
        alertType: 'alert',
    },
    API_ERROR_FILE_TOO_LARGE: {
        message: 'The file is too large (max 10 MB).',
        title: 'File Error',
        module: 'file',
        alertType: 'alert',
    },
    API_ERROR_FILE_DATA_REQUIRED: {
        message: 'File data is required.',
        title: 'File Error',
        module: 'file',
        alertType: 'alert',
    },

    // 7. Other/Service/Server
    API_ERROR_INVALID_REQUEST: {
        message: 'Action is not available. Refresh the page and/or try again later.',
        title: 'Request Error',
        module: 'api',
        alertType: 'alert',
    },
    API_ERROR_NOT_IMPLEMENTED: {
        message: 'API is not implemented on server side.',
        title: 'Server Error',
        module: 'server',
        alertType: 'alert',
    },
    API_ERROR_SERVICE_UNAVAILABLE: {
        message: 'Service is temporarily unavailable. Please try again later.',
        title: 'Server Error',
        module: 'server',
        alertType: 'alert',
    },
    API_ERROR_INTERNAL_SERVER_ERROR: {
        message: 'Problem with processing your request.',
        title: 'Server Error',
        module: 'server',
        alertType: 'alert',
    },
};
