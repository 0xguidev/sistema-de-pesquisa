
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
import { FetchQuestionsBySurveyIdUseCase } from '@/domain/use-cases/question/fetch-questions-by-survey-id'

@Controller('/questions/survey/:id')
export class FetchQuestionsBySurveyIdController {
  constructor(
    private fetchQuestionsBySurveyId: FetchQuestionsBySurveyIdUseCase,
  ) {}

  @Get()
  async handle(
    @CurrentUser() user: UserPayload,
    @Param('id') surveyId: string,
  ) {
    const accountId = user.sub

    const result = await this.fetchQuestionsBySurveyId.execute({
      surveyId,
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

    return question.map((question) => ({
      id: question.id.toString(),
      questionTitle: question.questionTitle,
      questionNum: question.questionNum,
      surveyId: question.surveyId.toString(),
      accountId: question.accountId.toString(),
    }))
  }
}
