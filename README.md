# nestjs-knex-starter

Backend starter — NestJS 11 + Knex 3 / Objection (MySQL / MariaDB) + TypeScript 6.

## Requirements

- Node.js 24 (see `.nvmrc`; `>=22.12` works)
- MySQL 8 / MariaDB 10.4+ — XAMPP, a local install, or Docker (`npm run db:up`)

## Quick start

```bash
cp .env.example .env        # set DB_* and secrets
npm install
npm run setup               # creates the database, builds, runs migrations
npm run start:dev
```

- API: `http://localhost:3000/api` (every request needs the `X-API-Key: <API_APP_KEY>` header)
- Health check: `http://localhost:3000/api/common/health-check`
- Swagger (when `IS_SWAGGER_UI_ACTIVE=true`): `http://localhost:3000/rest-docs`
  - Outside `NODE_ENV=development` it is protected with `BASIC_AUTH_USER_NAME` / `BASIC_AUTH_PASSWORD` and is disabled if no password is set.
No local MySQL? `npm run db:up` starts one in Docker using the `DB_*` values from `.env` (`DB_USER` must be `root`).

## Auth

Send the returned `accessToken` as the `x-session-key` header. Full logins also return a `refreshToken` for `POST /auth/refresh`. Endpoints that create a session accept an optional `x-device-id` header (one session per user per device). The OTP `000000` is accepted everywhere except `NODE_ENV=production`.

| Flow | Endpoints |
| --- | --- |
| Phone OTP (one step) | `send-otp` → `verify-otp` |
| Phone OTP (two step) | `login-with-phone` (returns a verify-only session) → `verify-login-otp` (with that session) |
| Email & password | `create-account` (sends email OTP) → `verify-login-otp` with `{ email, code }`; later `sign-in` |
| Resend a verification code | `resend-verification-otp` (with the session) |
| Google / Apple | `google-sign-in` (Google ID token) / `apple-sign-in` (Apple identity token) |
| Forgot password | `reset-password` → `verify-reset-password-otp` → `recover-password` (signs out everywhere) → `login-with-token` |
| Other | `check-user-exists`, `guest-sign-in`, `refresh`, `logout` |

- Unverified users get a session but no refresh token, and routes using `@UserPassport()` reject them until they verify. Pass `@UserPassport({ allowUnverifiedUser: true })` to allow them.
- Passwords are hashed with Node's built-in scrypt (`creds` table).
- Emails use `templates/email/<type>/{subject,html}.pug`. Without `SMTP_HOST` they are logged instead of sent. SMS goes through Twilio when `IS_SMS_ON=true`.
- Social sign-in needs `GOOGLE_CLIENT_IDS` / `APPLE_SIGN_IN_BUNDLE_IDS` (comma separated). Accounts are linked by email only when the provider marks the email as verified.

## File uploads

`POST /api/common/file-data` requires a login. Send it as `multipart/form-data` with a `file` field and optional `name` and `type` fields (`IMAGE`, `VIDEO`, `DOCUMENT` or `OTHER`; detected from the mime type when omitted). It returns the stored file's URL and saves a row in `file_data`.

- Limits: 10 MB, one file. Allowed types are images, mp4/mov/webm video, PDF, Word/Excel, txt and csv (see `src/services/storage/storage.constants.ts`).
- Images get a 500px WebP thumbnail (`thumbUrl`) and their original `width` and `height` recorded.
- Storage: S3 when `AWS_S3_BUCKET` is set (public URL from `CLOUD_FRONT_BUCKET_URL` if present). Otherwise files go to `public/uploads/` and are served at `API_DOMAIN/uploads/...`, so it works locally without AWS.
- Use `StorageService` (`src/services/storage`) from any module that needs to upload or delete files.

## Scripts

| Script | Description |
| --- | --- |
| `npm run setup` | Create database + build + migrate |
| `npm run start:dev` | Start in watch mode |
| `npm run build` / `npm run start:prod` | Build to `dist/` and run it |
| `npm run db:create` | Create the `DB_DATABASE` database if missing |
| `npm run db:up` / `npm run db:down` | Start / stop the Docker MySQL from `compose.yaml` |
| `npm run migrate:make <name>` | Create a new TypeScript migration in `src/db/migrations` |
| `npm run migrate:latest` / `migrate:rollback` | Apply / roll back migrations (runs from `dist/`, build first) |
| `npm run seed:run` | Run seeds (build first) |
| `npm run lint` / `npm run typecheck` / `npm test` | Code quality checks |

## Included for future use

AWS S3/SES (`@aws-sdk/*`), `nodemailer` + `email-templates`, `sharp`, `twilio`, `firebase-admin`, socket.io (`@nestjs/websockets`), `@nestjs/schedule`, `@nestjs/event-emitter`.
