import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module'
import {
  envSchema,
  isCorsOriginAllowed,
  parseCorsOrigin,
  validateRequiredEnv,
} from './infra/env/env'
import { requireHttps } from './infra/http/secure-transport'

async function bootstrap() {
  validateRequiredEnv(process.env)
  const env = envSchema.parse(process.env)

  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  const corsOrigin = parseCorsOrigin(process.env.CORS_ORIGIN!)
  const trustedProxyHops = env.TRUST_PROXY_HOPS

  app.set('trust proxy', trustedProxyHops)

  if (env.REQUIRE_HTTPS) {
    app.use(requireHttps)
  }

  app.enableCors({
    origin: (origin, callback) =>
      callback(null, isCorsOriginAllowed(corsOrigin, origin)),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  })

  await app.listen(env.PORT)
}

bootstrap()
