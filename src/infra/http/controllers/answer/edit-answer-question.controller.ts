import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Param,
  Put,
} from '@nestjs/common'
import { z } from 'zod'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { EditAnswerQuestionUseCase } from '@/domain/use-cases/answer-question/edit-answer-question'

const editAnswerQuestionBodySchema = z.object({
  questionId: z.string().optional(),
  optionAnswerId: z.string().optional(),
})

const bodyValidationPipe = new ZodValidationPipe(editAnswerQuestionBodySchema)

type EditAnswerQuestionBodySchema = z.infer<typeof editAnswerQuestionBodySchema>

@Controller('/answer-questions/:id')
export class EditAnswerQuestionController {
  constructor(private editAnswerQuestion: EditAnswerQuestionUseCase) {}

  @Put()
  @HttpCode(204)
  async handle(
    @CurrentUser() user: UserPayload,
    @Body(bodyValidationPipe) body: EditAnswerQuestionBodySchema,
    @Param('id') answerQuestionId: string,
  ) {
    const { questionId, optionAnswerId } = body
    const accountId = user.sub

    if (!optionAnswerId) {
      throw new BadRequestException()
    }

    const result = await this.editAnswerQuestion.execute({
      answerQuestionId,
      accountId,
      optionAnswerId,
      questionId,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }
  }
}
