import { Injectable } from '@nestjs/common'
import { Env } from './env'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class EnvService {
  constructor(private configService: ConfigService<Env, true>) {}

  get<T extends keyof Env>(key: T) {
    return this.configService.get(key, { infer: true })
  }

  getOrThrow<T extends keyof Env>(key: T): Env[T] {
    try {
      return this.configService.getOrThrow(key, { infer: true })
    } catch {
      throw new Error(`Missing required environment variable: ${String(key)}`)
    }
  }
}
