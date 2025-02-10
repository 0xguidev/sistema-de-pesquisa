import { Module } from '@nestjs/common'
import { HttpModule } from './infra/http/http.module'
import { AuthModule } from './infra/auth/auth.module'
import { EnvModule } from './infra/env/env.module'
import { ConfigModule } from '@nestjs/config'
import { envSchema } from './infra/env/env'

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (env) => envSchema.parse(env),
      isGlobal: true,
    }),
    AuthModule,
    HttpModule,
    EnvModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
