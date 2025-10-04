import { Module } from '@nestjs/common'
import { CreateAccountController } from './controllers/account/create-account.controller'
import { RegisterAccountUseCase } from '@/domain/use-cases/account/create-account'
import { DatabaseModule } from '../database/database.module'
import { CryptographyModule } from '../cryptography/cryptography.module'
import { AuthenticateController } from './controllers/authenticate/authenticate.controller'
import { AuthenticateAccountUseCase } from '@/domain/use-cases/account/authenticate-account'
import { CreateSurveyUseCase } from '@/domain/use-cases/survey/create-survey'
import { CreateSurveyController } from './controllers/survey/create-survey.controller'
import { CreateQuestionUseCase } from '@/domain/use-cases/question/create-question'
import { CreateQuestionController } from './controllers/question/create-question.controller'
import { CreateOptionAnswerUseCase } from '@/domain/use-cases/option-answer/create-option-answer'
import { CreateOptionAnswerController } from './controllers/option/create-option-answer.controller'
import { CreateInterviewUseCase } from '@/domain/use-cases/interview/create-interview'
import { CreateInterviewController } from './controllers/interview/create-interview.controller'
import { CreateAnswerQuestionUseCase } from '@/domain/use-cases/answer-question/create-answer-question'
import { CreateAnswerQuestionController } from './controllers/answer/create-answer-question.controller'
import { DeleteSurveyController } from './controllers/survey/delete-survey.controller'
import { DeleteSurveyUseCase } from '@/domain/use-cases/survey/delete-survey'
import { DeleteQuestionUseCase } from '@/domain/use-cases/question/delete-question'
import { DeleteQuestionController } from './controllers/question/delete-question.controller'
import { DeleteOptionAnswerUseCase } from '@/domain/use-cases/option-answer/delete-option-answer'
import { DeleteOptionAnswerController } from './controllers/option/delete-option.controller'
import { DeleteInterviewUseCase } from '@/domain/use-cases/interview/delete-interview'
import { DeleteInterviewController } from './controllers/interview/delete-interview.controller'
import { DeleteAnswerQuestionController } from './controllers/answer/delete-answer-question.controller'
import { DeleteAnswerQuestionUseCase } from '@/domain/use-cases/answer-question/delete-answer-question'
import { EditSurveyUseCase } from '@/domain/use-cases/survey/edit-survey'
import { EditSurveyController } from './controllers/survey/edit-survey.controller'
import { EditQuestionUseCase } from '@/domain/use-cases/question/edit-question'
import { EditQuestionController } from './controllers/question/edit-question.controller'
import { EditOptionAnswerUseCase } from '@/domain/use-cases/option-answer/edit-option-answer'
import { EditOptionAnswerController } from './controllers/option/edit-option.controller'
import { EditAnswerQuestionUseCase } from '@/domain/use-cases/answer-question/edit-answer-question'
import { EditAnswerQuestionController } from './controllers/answer/edit-answer-question.controller'
import { FetchSurveyListController } from './controllers/survey/fetch-survey-list.controller'
import { FetchSurveyListUseCase } from '@/domain/use-cases/survey/fetch-survey-list'
import { FetchSurveyIdUseCase } from '@/domain/use-cases/survey/fetch-survey-id'
import { FetchSurveyByIdController } from './controllers/survey/fetch-survey-id.controller'
import { FetchInterviewsController } from './controllers/interview/fetch-interviews.controller'
import { FetchInterviewsBySurveyIdUseCase } from '@/domain/use-cases/interview/fetch-interview-by-survey-id'
import { GenerateSimpleReportWordUseCase } from '@/domain/use-cases/report/generate-simple-report-word'
import { GenerateSimpleReportUseCase } from '@/domain/use-cases/report/generate-simple-report'
import { GenerateSimpleReportController } from './controllers/report/generate-simple-report.controller'
import { GenerateCrossTabulationWordUseCase } from '@/domain/use-cases/report/generate-cross-tabulation-word'
import { GenerateCrossTabulationUseCase } from '@/domain/use-cases/report/generate-cross-tabulation'
import { GenerateCrossTabulationController } from './controllers/report/generate-cross-tabulation.controller'

@Module({
  imports: [DatabaseModule, CryptographyModule],
  providers: [
    RegisterAccountUseCase,
    AuthenticateAccountUseCase,
    CreateSurveyUseCase,
    CreateQuestionUseCase,
    CreateOptionAnswerUseCase,
    CreateInterviewUseCase,
    CreateAnswerQuestionUseCase,
    DeleteSurveyUseCase,
    DeleteQuestionUseCase,
    DeleteOptionAnswerUseCase,
    DeleteInterviewUseCase,
    DeleteAnswerQuestionUseCase,
    EditSurveyUseCase,
    EditQuestionUseCase,
    EditOptionAnswerUseCase,
    EditAnswerQuestionUseCase,
    FetchSurveyListUseCase,
    FetchSurveyIdUseCase,
    FetchInterviewsBySurveyIdUseCase,
    GenerateSimpleReportWordUseCase,
    GenerateSimpleReportUseCase,
    GenerateCrossTabulationWordUseCase,
    GenerateCrossTabulationUseCase,
  ],
  controllers: [
    CreateAccountController,
    AuthenticateController,
    CreateSurveyController,
    CreateQuestionController,
    CreateOptionAnswerController,
    CreateInterviewController,
    CreateAnswerQuestionController,
    DeleteSurveyController,
    DeleteQuestionController,
    DeleteOptionAnswerController,
    DeleteInterviewController,
    DeleteAnswerQuestionController,
    EditSurveyController,
    EditQuestionController,
    EditOptionAnswerController,
    EditAnswerQuestionController,
    FetchSurveyListController,
    FetchSurveyByIdController,
    FetchInterviewsController,
    GenerateSimpleReportController,
    GenerateCrossTabulationController,
  ],
})
export class HttpModule {}
