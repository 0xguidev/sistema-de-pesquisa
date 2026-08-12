
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { FetchQuestionByIdUseCase } from '@/domain/use-cases/question/fetch-question-by-id'

@Controller('/questions/:id')
export class FetchQuestionByIdController {
  constructor(private fetchQuestionById: FetchQuestionByIdUseCase) {}

  @Get()
  async handle(
    @CurrentUser() user: UserPayload,
    @Param('id') questionId: string,
  ) {
    const accountId = user.sub

    const result = await this.fetchQuestionById.execute({
      questionId,
      accountId,
    })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof ResourceNotFoundError) {
        throw new NotFoundException(error.message)
      }

      if (error instanceof NotAllowedError) {
        throw new ForbiddenException(error.message)
      }

      throw new BadRequestException()
    }

    const { question } = result.value

    return {
      question: {
        id: question.id.toString(),
        questionTitle: question.questionTitle,
        questionNum: question.questionNum,
        surveyId: question.surveyId.toString(),
        accountId: question.accountId.toString(),
        slug: question.slug.value,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
      },
    }
  }
}
