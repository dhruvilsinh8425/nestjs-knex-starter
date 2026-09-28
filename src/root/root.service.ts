import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { renderFile } from 'pug';
import { AppStoreRedirectRequest } from 'src/common/dto/requests.dto';
import { resolve } from 'path';
@Injectable()
export class RootService {
    private logger: Logger;

    constructor(private configService: ConfigService) {
        this.logger = new Logger(RootService.name);
    }

    async appStoreRedirect(dto: AppStoreRedirectRequest): Promise<string> {
        // http://localhost:3000/app-store?page=apartment&id=1
        const redirectPage = renderFile(resolve('./templates/web/app_store.pug'), {
            ...dto,
            appOpenSlug: this.configService.get('APP_OPEN_SLUG', 'app'),
            appName: this.configService.get('PROJECT_NAME', 'App Name'),
            appleStoreUrl: this.configService.get('APP_ITUNES_URL', ''),
            googlePlayUrl: this.configService.get('GOOGLE_PLAY_URL', ''),
            webSite: this.configService.get('WEB_DOMAIN', '//'),
        });

        return redirectPage;
    }
}
