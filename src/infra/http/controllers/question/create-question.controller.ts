import { CreateQuestionUseCase } from '@/domain/use-cases/question/create-question'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
} from '@nestjs/common'
import { z } from 'zod'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'

const questionBodySchema = z.object({
  questionTitle: z.string(),
  questionNum: z.number(),
  surveyId: z.string(),
  conditionalRules: z
    .array(
      z.object({
        dependsOnQuestionId: z.string(),
        dependsOnOptionId: z.string(),
        operator: z.string(),
      }),
    )
    .optional(),
})

type QuestionBodySchema = z.infer<typeof questionBodySchema>

@Controller('/questions')
export class CreateQuestionController {
  constructor(private question: CreateQuestionUseCase) {}

  @Post()
  @HttpCode(201)
  async handle(
    @CurrentUser() user: UserPayload,
    @Body(new ZodValidationPipe(questionBodySchema))
    body: QuestionBodySchema,
  ) {
    const { questionTitle, questionNum, surveyId, conditionalRules } = body
    const userId = user.sub

    const result = await this.question.execute({
      questionTitle,
      questionNum,
      surveyId,
      accountId: userId,
      conditionalRules: conditionalRules?.map((rule) => ({
        dependsOnQuestionId: rule.dependsOnQuestionId,
        dependsOnOptionId: rule.dependsOnOptionId,
        operator: rule.operator,
      })),
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }

    return {
      question: result.value.question,
    }
  }
}
