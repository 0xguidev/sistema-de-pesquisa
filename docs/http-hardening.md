# HTTP and container hardening

The API sends `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, a
no-referrer policy, and a restrictive Content Security Policy. Express version
disclosure is disabled. When `REQUIRE_HTTPS=true`, HTTP is rejected and HTTPS
responses include HSTS; configure `TRUST_PROXY_HOPS` to match the trusted TLS
terminator.

`CORS_ORIGIN` is an exact, comma-separated allowlist. Production permits only
HTTPS origins. Development and test may additionally use HTTP for localhost,
`127.0.0.1`, or `::1`. Credentials are enabled, so universal and partial
wildcards are never accepted. CORS allows only `GET`, `POST`, `PUT`, `PATCH`,
and `DELETE`, with `Authorization` and `Content-Type` request headers.

JSON requests are limited to 100 KiB and URL-encoded requests to 50 KiB.

The base Compose file does not publish PostgreSQL and requires
`POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB`. To explicitly expose
the database on the loopback interface for local development, run:

```sh
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

Override `POSTGRES_DEV_PORT` if port 5433 is unavailable. Production should use
only `docker-compose.yml` and should inject secrets through its deployment
secret manager.
