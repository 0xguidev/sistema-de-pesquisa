import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { EnvModule } from '../env/env.module'
import { EnvService } from '../env/env.service'
import { JwtStrategy } from './jwt.strategy'
import { APP_GUARD } from '@nestjs/core'
import { JwtAuthGuard } from './jwt-auth.guard'
import { DatabaseModule } from '../database/database.module'
import { SessionService } from './session.service'
import { RolesGuard } from './roles.guard'

@Module({
  imports: [
    DatabaseModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [EnvModule],
      inject: [EnvService],
      global: true,
      useFactory(env: EnvService) {
        const privateKey = env.getOrThrow('JWT_PRIVATE_KEY')
        const publicKey = env.getOrThrow('JWT_PUBLIC_KEY')

        return {
          signOptions: {
            algorithm: 'RS256',
            expiresIn: '10m',
            issuer: 'sistema-de-pesquisa',
            audience: 'sistema-de-pesquisa',
          },
          privateKey: Buffer.from(privateKey, 'base64'),
          publicKey: Buffer.from(publicKey, 'base64'),
        }
      },
    }),
  ],
  providers: [
    JwtStrategy,
    SessionService,
    EnvService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [SessionService],
})
export class AuthModule {}
