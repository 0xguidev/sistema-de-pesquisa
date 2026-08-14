import { HashComparer } from '@/domain/cryptography/hash-comparer'
import { HashGenerator } from '@/domain/cryptography/hash-generator'
import { EnvService } from '@/infra/env/env.service'
import { Injectable } from '@nestjs/common'
import { compare, getRounds, hash } from 'bcryptjs'

@Injectable()
export class BcryptHasher implements HashGenerator, HashComparer {
  constructor(private readonly envService: EnvService) {}

  hash(plain: string): Promise<string> {
    return hash(plain, this.envService.get('BCRYPT_COST'))
  }

  compare(plain: string, hashed: string): Promise<boolean> {
    return compare(plain, hashed)
  }

  needsRehash(hashed: string): boolean {
    return getRounds(hashed) < this.envService.get('BCRYPT_COST')
  }
}
