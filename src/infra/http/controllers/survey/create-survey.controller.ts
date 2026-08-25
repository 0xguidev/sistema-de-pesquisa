import { PersistenceConflictError } from '@/domain/use-cases/error/persistence-conflict.error'
import { CreateCompleteSurveyUseCase } from '@/domain/use-cases/survey/create-complete-survey'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Post,
} from '@nestjs/common'
import { z } from 'zod'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
const surveyBodySchema = z.object({
  title: z.string().trim().min(1),
  location: z.string().trim().min(1),
  type: z.string().trim().min(1),
  questions: z
    .object({
      questionTitle: z.string().trim().min(1),
      questionNum: z.number().int().positive(),
      conditionalRules: z
        .object({
          questionNum: z.number().int().positive(),
          optionNum: z.number().int().positive(),
        })
        .array()
        .optional(),
      options: z
        .object({
          optionTitle: z.string().trim().min(1),
          optionNum: z.number().int().positive(),
        })
        .array(),
    })
    .array()
    .optional(),
})

type SurveyBodySchema = z.infer<typeof surveyBodySchema>

@Controller('/surveys')
export class CreateSurveyController {
  constructor(private createCompleteSurvey: CreateCompleteSurveyUseCase) {}

  @Post()
  async handle(
    @CurrentUser()
    user: UserPayload,
    @Body(new ZodValidationPipe(surveyBodySchema))
    body: SurveyBodySchema,
  ) {
    const { title, location, type, questions } = body
    const userId = user.sub

    const result = await this.createCompleteSurvey.execute({
      title,
      location,
      type,
      accountId: userId,
      questions: questions?.map((question) => ({
        ...question,
        conditionalRules: question.conditionalRules?.map((rule) => ({
          dependsOnQuestionNumber: rule.questionNum,
          dependsOnOptionNumber: rule.optionNum,
        })),
      })),
    })

    if (result.isLeft()) {
      if (result.value instanceof PersistenceConflictError) {
        throw new ConflictException(
          'Não foi possível criar a pesquisa devido a dados conflitantes.',
        )
      }
      throw new BadRequestException(
        'Falha ao criar pesquisa. Verifique perguntas, opções e regras condicionais.',
      )
    }

    return {
      message: 'Pesquisa criada com sucesso.',
      surveyId: result.value.survey.id.toString(),
    }
  }
}
