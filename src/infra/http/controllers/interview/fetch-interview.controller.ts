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
import { FetchInterviewUseCase } from '@/domain/use-cases/interview/fetch-interview-by-id'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'

const interviewIdParamSchema = z.object({
  interviewId: z.string().uuid(),
})

type InterviewIdParam = z.infer<typeof interviewIdParamSchema>

@Controller('/interviews/:interviewId')
export class FetchInterviewController {
  constructor(private fetchInterview: FetchInterviewUseCase) {}

  @Get()
  async handle(
    @CurrentUser() user: UserPayload,
    @Param(new ZodValidationPipe(interviewIdParamSchema)) params: InterviewIdParam,
  ) {
    const result = await this.fetchInterview.execute({
      interviewId: params.interviewId,
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

    const { interview } = result.value

    return {
      interview: {
        id: interview.id.toString(),
        surveyId: interview.surveyId.toString(),
        accountId: interview.accountId.toString(),
        createdAt: interview.createdAt,
        updatedAt: interview.updatedAt,
      },
    }
  }
}
