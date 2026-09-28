import { join, resolve } from 'path';
import { writeFileSync } from 'fs';
import basicAuth from 'express-basic-auth';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import { ApiModulesList } from 'src/api';
import { GlobalExceptionFilter } from 'src/exceptions';
import { swaggerConfig } from './swagger';
const logger = new Logger('Api Server');

const bootstrap = async () => {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        cors: true,
        rawBody: true,
    });
    app.enableCors({
        preflightContinue: false,
        optionsSuccessStatus: 204,
        origin: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });

    const configService = app.get(ConfigService);
    const port = parseInt(configService.get('API_PORT', '3000'), 10);
    const apiRoutePrefix = configService.get('API_ROUTE_PREFIX', 'api');
    const apiDoc = configService.get('SWAGGER_DOC_URL', 'rest-docs');
    const appName = configService.get('PROJECT_NAME', 'Swagger UI');
    const isSwaggerOn = configService.get('IS_SWAGGER_UI_ACTIVE', 'false').toLowerCase() === 'true';
    const env = configService.get('NODE_ENV', '');
    app.setGlobalPrefix(apiRoutePrefix);

    app.useGlobalPipes(
        new ValidationPipe({
            exceptionFactory: (errors) => errors,
            transform: true,
            whitelist: true,
        })
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.enable('trust proxy');
    app.disable('etag'); // Prevent code: 304 - Not Modified on IOS devices

    app.useStaticAssets(join(__dirname, '..', 'public'));

    const isSwaggerProtected = env !== 'development';
    const basicAuthPassword = configService.get<string>('BASIC_AUTH_PASSWORD', '');
    const isSwaggerServed = isSwaggerOn && (!isSwaggerProtected || !!basicAuthPassword);

    if (isSwaggerOn && !isSwaggerServed) {
        logger.warn('Swagger is disabled: set BASIC_AUTH_PASSWORD to serve it outside development');
    }

    if (isSwaggerServed) {
        if (isSwaggerProtected) {
            app.use(
                [`/${apiDoc}`, `/${apiDoc}-json`],
                basicAuth({
                    challenge: true,
                    users: {
                        [configService.get('BASIC_AUTH_USER_NAME', 'admin')]: basicAuthPassword,
                    },
                })
            );
        }

        const apiGuideLink = configService.get('API_GUIDE_LINK', '');
        const appName = configService.get('PROJECT_NAME', 'Project name');
        const document = SwaggerModule.createDocument(app, swaggerConfig({ appName, port, apiGuideLink }), {
            include: ApiModulesList,
        });

        // Export swagger doc in JSON format
        const swaggerDoc = resolve(env === 'development' ? 'src/swagger' : 'dist', 'swagger.doc.json');
        writeFileSync(swaggerDoc, JSON.stringify(document, null, 2));
        logger.debug(`${appName} Swagger doc in ${swaggerDoc}`);

        SwaggerModule.setup(apiDoc, app, document, {
            customSiteTitle: appName + ' | ' + 'Swagger UI',
            customfavIcon: configService.get<string>('APPLOGO'),
        });
    }

    await app.listen(port);

    logger.debug(`${appName} API Server started at http://localhost:${port}/${apiRoutePrefix}`);
    isSwaggerServed
        ? logger.debug(`${appName} Swagger Docs runs at http://localhost:${port}/${apiDoc}`)
        : logger.debug(`${appName} Swagger Docs is OFF`);
};

bootstrap().catch((error) => {
    logger.error(error);
    process.exit(1);
});
