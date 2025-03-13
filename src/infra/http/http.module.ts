import { Module } from '@nestjs/common'
import { CreateAccountController } from './controllers/create-account.controller'
import { RegisterAccountUseCase } from '@/domain/use-cases/account/create-account'
import { DatabaseModule } from '../database/database.module'
import { CryptographyModule } from '../cryptography/cryptography.module'

@Module({
  imports: [DatabaseModule, CryptographyModule],
  providers: [RegisterAccountUseCase],
  controllers: [CreateAccountController],
})
export class HttpModule {}
