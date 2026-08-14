import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import {
  isCorsOriginAllowed,
  parseCorsOrigin,
  validateRequiredEnv,
} from './infra/env/env'

async function bootstrap() {
  validateRequiredEnv(process.env)

  const app = await NestFactory.create(AppModule)
  const corsOrigin = parseCorsOrigin(process.env.CORS_ORIGIN!)

  app.enableCors({
    origin: (origin, callback) =>
      callback(null, isCorsOriginAllowed(corsOrigin, origin)),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  })

  await app.listen(process.env.PORT ?? 3000)
}

bootstrap()
