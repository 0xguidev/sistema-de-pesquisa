import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module'
import {
  isCorsOriginAllowed,
  parseCorsOrigin,
  validateRequiredEnv,
} from './infra/env/env'

async function bootstrap() {
  validateRequiredEnv(process.env)

  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  const corsOrigin = parseCorsOrigin(process.env.CORS_ORIGIN!)
  const trustedProxyHops = Number(process.env.TRUST_PROXY_HOPS ?? 0)

  app.set('trust proxy', trustedProxyHops)

  app.enableCors({
    origin: (origin, callback) =>
      callback(null, isCorsOriginAllowed(corsOrigin, origin)),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  })

  await app.listen(process.env.PORT ?? 3000)
}

bootstrap()
