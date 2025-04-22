import { Module } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service'
import { AccountRepository } from '@/domain/repositories/account-repository'
import { PrismaAccountRepository } from './prisma/repositories/prisma-account-repository'
import { PrismaSurveyRepository } from './prisma/repositories/prisma-survey-repository'
import { PrismaQuestionRepository } from './prisma/repositories/prisma-question-repository'
import { PrismaOptionAnswerRepository } from './prisma/repositories/prisma-option-answer-repository'
import { PrismaInterviewRepository } from './prisma/repositories/prisma-interview-repository'
import { PrismaAnswerQuestionRepository } from './prisma/repositories/prisma-answer-question-repository'

@Module({
  providers: [
    PrismaService,
    {
      provide: AccountRepository,
      useClass: PrismaAccountRepository,
    },
    PrismaSurveyRepository,
    PrismaQuestionRepository,
    PrismaOptionAnswerRepository,
    PrismaInterviewRepository,
    PrismaAnswerQuestionRepository,
  ],
  exports: [
    PrismaService,
    AccountRepository,
    PrismaSurveyRepository,
    PrismaQuestionRepository,
    PrismaOptionAnswerRepository,
    PrismaInterviewRepository,
    PrismaAnswerQuestionRepository,
  ],
})
export class DatabaseModule {}
