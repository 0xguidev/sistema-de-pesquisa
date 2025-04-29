import { BadRequestException, Body, Controller, Post } from '@nestjs/common'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { CreateOptionAnswerUseCase } from '@/domain/use-cases/option-answer/create-option-answer'
import { CurrentUser } from '@/infra/auth/current-user-decorator'

const createOptionAnswerBodySchema = z.object({
  optionTitle: z.string(),
  optionNum: z.number(),
  questionId: z.string().uuid(),
})

const bodyValidationPipe = new ZodValidationPipe(createOptionAnswerBodySchema)

type CreateOptionAnswerBodySchema = z.infer<typeof createOptionAnswerBodySchema>

@Controller('/option-answers')
export class CreateOptionAnswerController {
  constructor(private createOptionAnswer: CreateOptionAnswerUseCase) {}

  @Post()
  async handle(
    @Body(bodyValidationPipe) body: CreateOptionAnswerBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const { optionTitle, optionNum, questionId } = body
    const userId = user.sub

    const result = await this.createOptionAnswer.execute({
      optionTitle,
      optionNum,
      accountId: userId,
      questionId,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }
  }
}
