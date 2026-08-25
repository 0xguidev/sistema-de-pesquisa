# Authentication security

Access tokens retain the existing RS256 claims and response shape, but expire after
`ACCESS_TOKEN_TTL_SECONDS` (900 seconds by default). Refresh tokens keep their
current opaque format and are rotated on every successful use.

## Deployment cryptography and transport

`JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY` must be Base64 encodings of matching PEM RSA
keys with a modulus of at least 2048 bits. Generate a deployment-specific pair, for
example:

```sh
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out jwt-private.pem
openssl pkey -in jwt-private.pem -pubout -out jwt-public.pem
base64 -w 0 jwt-private.pem
base64 -w 0 jwt-public.pem
```

Store the resulting values in a secret manager, never in source control or logs.
Startup reports only the invalid variable name/constraint and never its value.
`ACCESS_TOKEN_TTL_SECONDS` accepts 300 through 86400 seconds.

Database transport must always be explicit. Local development and tests may set
`DATABASE_TLS_MODE=disable` only with `sslmode=disable` in `DATABASE_URL`.
Production requires `DATABASE_TLS_MODE=require` and an URL containing
`sslmode=require`, `sslmode=verify-ca`, or `sslmode=verify-full`; use
`verify-full` where the provider supplies a trusted CA and hostname-valid
certificate. Never print `DATABASE_URL`, since it normally contains credentials.

Production also requires `SESSION_IP_HASH_SECRET` as Base64 for at least 32 random
bytes (for example, `openssl rand -base64 32`). Rotate it through the deployment's
secret-management process.

For an application behind a TLS-terminating proxy, set `TRUST_PROXY_HOPS` to the
exact number of trusted proxy hops and `REQUIRE_HTTPS=true`. The application then
rejects requests not identified as HTTPS by the trusted proxy and emits HSTS only
for accepted HTTPS requests. Do not enable proxy trust for untrusted direct traffic.

Login, registration, and refresh are rate limited. Refresh has independent IP and
session buckets. The session identifier is accepted only when it has the UUID shape
used by refresh tokens and is SHA-256 hashed before becoming a rate-limit key.
`RATE_LIMIT_STORE=database` is the default and stores atomic counters in PostgreSQL,
so all replicas share a limit. `memory` is suitable only for local development and
tests; it must not be used for a multi-replica production deployment.

Passwords are checked through the domain-level `PasswordCompromiseChecker`
interface. The bundled local implementation compares SHA-256 digests against a
small built-in denylist plus `COMPROMISED_PASSWORD_SHA256`. A breach-corpus service
(for example, a k-anonymity API or an internal database) can be integrated by
providing another implementation in `HttpModule`; implementations must never log
or persist the plaintext password.

There are currently no administrative HTTP routes: no controller uses `@Roles`.
Public registration always creates `USER` accounts and ignores role input. The role
guard remains as an enforcement point for a future administrative surface. Any such
surface must require `@Roles('ADMIN')` and a stronger control such as MFA or recent
reauthentication before it is introduced.
