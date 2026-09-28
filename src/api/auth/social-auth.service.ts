import { OAuth2Client } from 'google-auth-library';
import jwt, { JwtHeader, JwtPayload } from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiException } from 'src/exceptions';
import { ApiEC } from 'src/exceptions/apiec.enum';

export type SocialProfile = {
    socialId: string;
    email?: string;
    isEmailVerified: boolean;
    firstName?: string;
    lastName?: string;
    avatar?: string;
};

const appleIssuer = 'https://appleid.apple.com';

@Injectable()
export class SocialAuthService {
    private readonly logger = new Logger(SocialAuthService.name);
    private readonly googleClient = new OAuth2Client();
    private readonly appleJwks = new JwksClient({
        jwksUri: `${appleIssuer}/auth/keys`,
        cache: true,
        cacheMaxAge: 24 * 60 * 60 * 1000,
    });

    constructor(private readonly configService: ConfigService) {}

    private listFromEnv(key: string): string[] {
        return (this.configService.get<string>(key) || '')
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean);
    }

    async verifyGoogleIdToken(idToken: string): Promise<SocialProfile> {
        const audience = this.listFromEnv('GOOGLE_CLIENT_IDS');
        if (!audience.length) {
            this.logger.error('GOOGLE_CLIENT_IDS is not configured');
            throw new ApiException(ApiEC.ServiceUnavailable);
        }

        try {
            const ticket = await this.googleClient.verifyIdToken({ idToken, audience });
            const payload = ticket.getPayload();

            if (!payload?.sub) {
                throw new Error('Missing subject');
            }

            return {
                socialId: payload.sub,
                email: payload.email?.toLowerCase(),
                isEmailVerified: !!payload.email_verified,
                firstName: payload.given_name,
                lastName: payload.family_name,
                avatar: payload.picture,
            };
        } catch (err) {
            this.logger.warn(`Google ID token rejected: ${err?.message}`);
            throw new ApiException(ApiEC.InvalidSocialToken);
        }
    }

    async verifyAppleIdentityToken(identityToken: string, appleUserId: string): Promise<SocialProfile> {
        const audience = this.listFromEnv('APPLE_SIGN_IN_BUNDLE_IDS');
        if (!audience.length) {
            this.logger.error('APPLE_SIGN_IN_BUNDLE_IDS is not configured');
            throw new ApiException(ApiEC.ServiceUnavailable);
        }

        try {
            const payload = await new Promise<JwtPayload>((resolve, reject) => {
                jwt.verify(
                    identityToken,
                    (header: JwtHeader, callback) => {
                        this.appleJwks
                            .getSigningKey(header.kid)
                            .then((key) => callback(null, key.getPublicKey()))
                            .catch((error) => callback(error));
                    },
                    { algorithms: ['RS256'], issuer: appleIssuer, audience: audience as [string, ...string[]] },
                    (error, decoded) => (error ? reject(error) : resolve(decoded as JwtPayload))
                );
            });

            if (!payload.sub || payload.sub !== appleUserId) {
                throw new Error('Subject does not match appleUserId');
            }

            return {
                socialId: payload.sub,
                email: typeof payload.email === 'string' ? payload.email.toLowerCase() : undefined,
                isEmailVerified: payload.email_verified === true || payload.email_verified === 'true',
            };
        } catch (err) {
            this.logger.warn(`Apple identity token rejected: ${err?.message}`);
            throw new ApiException(ApiEC.InvalidSocialToken);
        }
    }
}
