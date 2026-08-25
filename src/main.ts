import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { json, urlencoded } from 'express'
import { AppModule } from './app.module'
import {
  envSchema,
  isCorsOriginAllowed,
  parseCorsOrigin,
  validateRequiredEnv,
} from './infra/env/env'
import { requireHttps } from './infra/http/secure-transport'
import { defensiveHeaders } from './infra/http/http-security'

const JSON_BODY_LIMIT = '100kb'
const URL_ENCODED_BODY_LIMIT = '50kb'

async function bootstrap() {
  validateRequiredEnv(process.env)
  const env = envSchema.parse(process.env)

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  })
  const corsOrigins = parseCorsOrigin(env.CORS_ORIGIN)
  const trustedProxyHops = env.TRUST_PROXY_HOPS

  app.set('trust proxy', trustedProxyHops)
  app.disable('x-powered-by')
  app.use(defensiveHeaders)
  app.use(json({ limit: JSON_BODY_LIMIT }))
  app.use(urlencoded({ extended: true, limit: URL_ENCODED_BODY_LIMIT }))

  if (env.REQUIRE_HTTPS) {
    app.use(requireHttps)
  }

  app.enableCors({
    origin: (origin, callback) =>
      callback(null, isCorsOriginAllowed(corsOrigins, origin)),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    credentials: true,
  })

  await app.listen(env.PORT)
}

bootstrap()
