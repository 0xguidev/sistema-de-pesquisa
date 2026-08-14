import { Encrypter } from '@/domain/cryptography/encrypter'
import { HashComparer } from '@/domain/cryptography/hash-comparer'
import { HashGenerator } from '@/domain/cryptography/hash-generator'
import { Module } from '@nestjs/common'
import { JwtEncrypter } from './jwt-encrypter'
import { BcryptHasher } from './bcrypt-hasher'
import { EnvModule } from '../env/env.module'

@Module({
  imports: [EnvModule],
  providers: [
    BcryptHasher,
    { provide: Encrypter, useClass: JwtEncrypter },
    { provide: HashComparer, useExisting: BcryptHasher },
    { provide: HashGenerator, useExisting: BcryptHasher },
  ],
  exports: [Encrypter, HashComparer, HashGenerator],
})
export class CryptographyModule {}
