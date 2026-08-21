import { DeleteAnswerQuestionUseCase } from '@/domain/use-cases/answer-question/delete-answer-question'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import {
  Controller,
  Delete,
  ForbiddenException,
  HttpCode,
  Param,
  NotFoundException,
} from '@nestjs/common'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'

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
      if (result.value instanceof ResourceNotFoundError) {
        throw new NotFoundException(result.value.message)
      }
      if (result.value instanceof NotAllowedError) {
        throw new ForbiddenException(result.value.message)
      }
    }
  }
}
