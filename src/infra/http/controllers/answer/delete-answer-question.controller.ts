import { DeleteAnswerQuestionUseCase } from '@/domain/use-cases/answer-question/delete-answer-question'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import {
  BadRequestException,
  Controller,
  Delete,
  HttpCode,
  Param,
} from '@nestjs/common'

@Controller('/answer-questions/:id')
export class DeleteAnswerQuestionController {
  constructor(private deleteAnswerQuestion: DeleteAnswerQuestionUseCase) {}

  @Delete()
  @HttpCode(204)
  async handle(
    @CurrentUser() user: UserPayload,
    @Param('id') answerQuestionId: string,
  ) {
    const userId = user.sub

    const result = await this.deleteAnswerQuestion.execute({
      accountId: userId,
      answerQuestionId,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }
  }
}
