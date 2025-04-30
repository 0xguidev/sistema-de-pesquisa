import { Module } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service'
import { AccountRepository } from '@/domain/repositories/account-repository'
import { PrismaAccountRepository } from './prisma/repositories/prisma-account-repository'
import { PrismaSurveyRepository } from './prisma/repositories/prisma-survey-repository'
import { PrismaQuestionRepository } from './prisma/repositories/prisma-question-repository'
import { PrismaOptionAnswerRepository } from './prisma/repositories/prisma-option-answer-repository'
import { PrismaInterviewRepository } from './prisma/repositories/prisma-interview-repository'
import { PrismaAnswerQuestionRepository } from './prisma/repositories/prisma-answer-question-repository'
import { SurveyRepository } from '@/domain/repositories/survey-repository'
import { QuestionRepository } from '@/domain/repositories/question-repository'
import { OptionAnswerRepository } from '@/domain/repositories/option-answer-repository'
import { InterviewRepository } from '@/domain/repositories/interview-repository'
import { AnswerQuestionRepository } from '@/domain/repositories/answer-question-repository'

@Module({
  providers: [
    PrismaService,
    {
      provide: AccountRepository,
      useClass: PrismaAccountRepository,
    },
    {
      provide: SurveyRepository,
      useClass: PrismaSurveyRepository,
    },
    {
      provide: QuestionRepository,
      useClass: PrismaQuestionRepository,
    },
    {
      provide: OptionAnswerRepository,
      useClass: PrismaOptionAnswerRepository,
    },
    {
      provide: InterviewRepository,
      useClass: PrismaInterviewRepository,
    },
    {
      provide: AnswerQuestionRepository,
      useClass: PrismaAnswerQuestionRepository,
    },
  ],
  exports: [
    PrismaService,
    AccountRepository,
    SurveyRepository,
    QuestionRepository,
    OptionAnswerRepository,
    InterviewRepository,
    AnswerQuestionRepository,
  ],
})
export class DatabaseModule {}
