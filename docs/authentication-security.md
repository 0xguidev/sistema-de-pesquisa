# Authentication security

Access tokens retain the existing RS256 claims and response shape, but expire after
`ACCESS_TOKEN_TTL_SECONDS` (900 seconds by default). Refresh tokens keep their
current opaque format and are rotated on every successful use.

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
