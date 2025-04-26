import { Module } from '@nestjs/common'
import { CreateAccountController } from './controllers/create-account.controller'
import { RegisterAccountUseCase } from '@/domain/use-cases/account/create-account'
import { DatabaseModule } from '../database/database.module'
import { CryptographyModule } from '../cryptography/cryptography.module'
import { AuthenticateController } from './controllers/authenticate.controller'
import { AuthenticateAccountUseCase } from '@/domain/use-cases/account/authenticate-account'
import { CreateSurveyUseCase } from '@/domain/use-cases/survey/create-survey'
import { CreateSurveyController } from './controllers/create-survey.controller'
import { CreateQuestionUseCase } from '@/domain/use-cases/question/create-question'
import { CreateQuestionController } from './controllers/create-question.controller'

@Module({
  imports: [DatabaseModule, CryptographyModule],
  providers: [
    RegisterAccountUseCase,
    AuthenticateAccountUseCase,
    CreateSurveyUseCase,
    CreateQuestionUseCase,
  ],
  controllers: [
    CreateAccountController,
    AuthenticateController,
    CreateSurveyController,
    CreateQuestionController,
  ],
})
export class HttpModule {}
