import { Controller, Get, Param } from '@nestjs/common'
import { z } from 'zod'
import { GetOptionsByQuestionIdUseCase } from '@/domain/use-cases/option-answer/get-options-by-question-id'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'

const questionIdParamSchema = z.object({
  questionId: z.string().uuid(),
})

type QuestionIdParam = z.infer<typeof questionIdParamSchema>

@Controller('/option-answers/question/:questionId')
export class FetchOptionsByQuestionIdController {
  constructor(
    private getOptionsByQuestionId: GetOptionsByQuestionIdUseCase,
  ) {}

  @Get()
  async handle(
    @Param(new ZodValidationPipe(questionIdParamSchema))
    params: QuestionIdParam,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.getOptionsByQuestionId.execute({
      questionId: params.questionId,
      userId: user.sub,
    })

    return result.value
  }
}
