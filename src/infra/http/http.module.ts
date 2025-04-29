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
import { CreateOptionAnswerUseCase } from '@/domain/use-cases/option-answer/create-option-answer'
import { CreateOptionAnswerController } from './controllers/create-option-answer.controller'
import { CreateInterviewUseCase } from '@/domain/use-cases/interview/create-interview'
import { CreateInterviewController } from './controllers/create-interview.controller'

@Module({
  imports: [DatabaseModule, CryptographyModule],
  providers: [
    RegisterAccountUseCase,
    AuthenticateAccountUseCase,
    CreateSurveyUseCase,
    CreateQuestionUseCase,
    CreateOptionAnswerUseCase,
    CreateInterviewUseCase,
  ],
  controllers: [
    CreateAccountController,
    AuthenticateController,
    CreateSurveyController,
    CreateQuestionController,
    CreateOptionAnswerController,
    CreateInterviewController,
  ],
})
export class HttpModule {}
