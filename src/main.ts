import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { validateRequiredEnv } from './infra/env/env'

async function bootstrap() {
  validateRequiredEnv(process.env)

  const app = await NestFactory.create(AppModule)

  app.enableCors({
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  })

  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
