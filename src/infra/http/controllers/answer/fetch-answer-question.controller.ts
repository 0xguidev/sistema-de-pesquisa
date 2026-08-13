import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common'
import { z } from 'zod'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { GetAnswerQuestionUseCase } from '@/domain/use-cases/answer-question/get-answer-question'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'

const answerIdParamSchema = z.object({
  answerId: z.string().uuid(),
})

type AnswerIdParam = z.infer<typeof answerIdParamSchema>

@Controller('/answer-questions/:answerId')
export class FetchAnswerQuestionController {
  constructor(private getAnswerQuestion: GetAnswerQuestionUseCase) {}

  @Get()
  async handle(
    @CurrentUser() user: UserPayload,
    @Param(new ZodValidationPipe(answerIdParamSchema)) params: AnswerIdParam,
  ) {
    const result = await this.getAnswerQuestion.execute({
      answerQuestionId: params.answerId,
      accountId: user.sub,
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

    const { answerQuestion } = result.value

    return {
      answer: {
        id: answerQuestion.id.toString(),
        interviewId: answerQuestion.interviewId.toString(),
        questionId: answerQuestion.questionId.toString(),
        optionAnswerId: answerQuestion.optionAnswerId.toString(),
        accountId: answerQuestion.accountId.toString(),
        createdAt: answerQuestion.createdAt,
        updatedAt: answerQuestion.updatedAt,
      },
    }
  }
}
