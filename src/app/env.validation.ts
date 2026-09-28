import Joi from 'joi';

const isProduction = Joi.valid('production');
const flag = Joi.string().valid('true', 'false');

export const envValidationSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'staging', 'test', 'production').default('development'),
    PROJECT_NAME: Joi.string().default('App'),
    API_PORT: Joi.number().port().default(3000),
    API_APP_KEY: Joi.string().required(),
    API_ROUTE_PREFIX: Joi.string().default('api'),

    DB_HOST: Joi.string().required(),
    DB_PORT: Joi.number().port().default(3306),
    DB_USER: Joi.string().required(),
    DB_PASSWORD: Joi.string().allow('').default(''),
    DB_DATABASE: Joi.string().required(),

    JWT_SECRET: Joi.string().when('NODE_ENV', {
        is: isProduction,
        then: Joi.string().min(32).required(),
        otherwise: Joi.string().required(),
    }),
    JWT_MAX_AGE_SEC: Joi.number().integer().positive().default(86400),
    JWT_REFRESH_MAX_AGE_SEC: Joi.number().integer().positive().default(2592000),
    JWT_RESET_PASSWORD_MAX_AGE_SEC: Joi.number().integer().positive().default(900),

    BASIC_AUTH_PASSWORD: Joi.string().allow('').default(''),
    IS_SWAGGER_UI_ACTIVE: flag.default('false'),
    IS_SMS_ON: flag.default('false'),
    IS_CRON_ON: flag.default('false'),
    IS_REQUEST_LOG_ON: flag.default('false'),

    THROTTLE_TTL_SEC: Joi.number().integer().positive().default(60),
    THROTTLE_LIMIT: Joi.number().integer().positive().default(100),
    THROTTLE_AUTH_LIMIT: Joi.number().integer().positive().default(10),
}).unknown(true);
