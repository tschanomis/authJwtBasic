# authJwtBasic

Small single-account JWT learning application. Requires Node.js 22.12+ (Node 24 LTS recommended).

## Start the API

In `back`, run `npm ci`, copy `.env.example` to `.env`, and configure:

- `JWT_SECRET`: generate a fresh secret with `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64'))"`. Never reuse the old committed `secret`; old tokens must be invalidated.
- `AUTH_USERNAME`: your demo account name.
- `AUTH_PASSWORD_HASH`: generate using `npm run hash-password`. The command reads a password from stdin until EOF (Ctrl+D on Unix, Ctrl+Z then Enter on Windows). Input is visible in a normal terminal; use a private terminal or pipe from a trusted password manager. Use at least 15 characters. Copy only the resulting `salt:hash` into `.env`.
- `CLIENT_ORIGIN`: exact browser origin, default `http://localhost:3000`.

Then run `npm start`. Environment files are ignored by Git. Never put credentials in frontend environment variables. In hosting environments, provide secrets through the platform's secret manager; `node index.js` reads the existing process environment without requiring a file.

## Start the client

In `front`, run `npm ci` and `npm start`, then open `http://localhost:3000`.
Optionally set `VITE_API_URL` in `front/.env` to the API URL. Run `npm run build` for the production bundle in `front/dist`.
The obsolete CRA and Storybook setup has been replaced by Vite and React 19.

## Authentication flow

1. The form sends JSON credentials to `POST /auth/signup`. This historical path is retained for compatibility; it logs in the configured account and does **not** register users.
2. The API verifies a salted scrypt hash with a timing-safe comparison. It performs the hash calculation even for unknown usernames and returns the same 401 error for incorrect credentials.
3. Success returns public user information and a JWT in `x-access-token`. Tokens expire after 15 minutes. Verification requires HS256, the expected issuer/audience, the configured subject, and an expiration.
4. The client holds the token in component memory and sends it only in `Authorization: Bearer ...` to `POST /auth/protected`. Query-string tokens are rejected. Refreshing or logging out clears the client session. A copied token remains usable until expiration; this demo has no refresh tokens or server-side revocation.

Passwords, tokens and request bodies are not logged. Auth responses use `Cache-Control: no-store`. JSON size and credential types/lengths are checked; login has an IP-based limit of 10 requests per 15 minutes. CORS allows the configured client origin, but CORS itself is not authentication.

## Checks

```sh
cd back
npm test
npm audit
cd ../front
npm run build
npm audit
```

Tests cover configuration, scrypt, login failures, protected access, malformed/expired/forged JWTs, issuer/audience/subject/algorithm checks, query-token rejection, request validation, CORS and rate limiting.

## Deployment boundaries

This remains a single-account demo, not a complete identity service. Use HTTPS outside localhost. The limiter uses process memory and the socket IP: multi-instance deployments need a shared limiter store, and reverse proxies need a carefully configured trusted proxy policy. Do not blindly enable `trust proxy`. A production product also needs account storage, recovery, monitoring and a revocation/session policy.

Security choices follow [OWASP password storage guidance](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) (scrypt N=2^17, r=8, p=1) and [jsonwebtoken's signing/verification options](https://github.com/auth0/node-jsonwebtoken#readme).
