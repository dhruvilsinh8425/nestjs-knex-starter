export const authConstants = () => ({
    sessionTTL: parseInt(process.env.JWT_MAX_AGE_SEC || '86400', 10),
    loginVerifySessionTTL: 15 * 60,
    refreshTokenTTL: parseInt(process.env.JWT_REFRESH_MAX_AGE_SEC || '2592000', 10),
    resetTokenLength: 64,
    resetTokenTTL: parseInt(process.env.JWT_RESET_PASSWORD_MAX_AGE_SEC || '900', 10),
    loginTokenLength: 64,
    loginTokenTTL: 120,
    refreshTokenPrefix: 'refresh_',
});
