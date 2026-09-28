import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import getRawBody from 'raw-body';

@Injectable()
export class RawBodyMiddleware implements NestMiddleware {
    constructor(private configService: ConfigService) {}
    async use(req: Request, res: Response, next: NextFunction) {
        // console.log('ROW middleware', req.headers, req.method);
        const apiPrefix = this.configService.get('API_ROUTE_PREFIX', 'api');
        const isWebhook = req.originalUrl.match(new RegExp(`/${apiPrefix}/webhooks`, 'i'));
        if (req.method === 'POST' && isWebhook) {
            //req.headers['content-type']?.includes('application/json') &&
            try {
                req['rawBody'] = await getRawBody(req);
                // console.log('rawBody', req['rawBody']);
            } catch (err) {
                console.error('Error reading raw body:', err);
                // return res.status(400).send('Invalid body');
            }
        }
        next();
    }
}
