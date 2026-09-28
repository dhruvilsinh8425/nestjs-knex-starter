export enum ApiEC {
    // 0. Other/Service/Server
    None = 0,
    InternalServerError = 500,
    ServiceUnavailable = 503,

    // 1. Authentication & Authorization (1000-1099)
    AccessDenied = 1000,
    WrongAppKey = 1001,
    OTPCodeExpired = 1002,
    PhoneAlreadyVerified = 1003,
    EmailAlreadyVerified = 1004,
    UserEmailIsNotVerified = 1005,
    UserPhoneIsNotVerified = 1006,
    UnsupportedAppVersion = 1007,
    IncorrectEmailOrPassword = 1008,
    PasswordRecoveryTokenExpired = 1009,
    InvalidSocialToken = 1010,

    // 2. Validation/Input (2000-2099)
    WrongInput = 2000,
    InvalidRequest = 2001,
    PleaseAddValidPhoneNo = 2002,
    WrongInputPhone = 2003,
    PhoneNumberWrong = 2004,
    PhoneOrEmailRequired = 2005,

    // 3. User/Account (3000-3099)
    UserNotFound = 3001,
    PhoneAlreadyExist = 3002,
    PhoneAlreadyRegistered = 3003,
    UserNotFoundByPhone = 3004,
    AccountInactive = 3005,
    EmailAlreadyExist = 3006,
    UserNotFoundByEmail = 3007,

    // 4. File/Media (4000-4099)
    FileDataRequired = 4000,
    ImageFileRequired = 4001,
    WrongImageFormat = 4002,
    FileTooLarge = 4003,
    UnsupportedFileType = 4004,
}
