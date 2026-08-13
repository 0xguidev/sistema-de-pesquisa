import { Controller, Get, Param } from '@nestjs/common'
import { z } from 'zod'
import { FetchAnswersByInterviewIdUseCase } from '@/domain/use-cases/answer-question/fetch-answers-by-interview-id'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'

const interviewIdParamSchema = z.object({
  interviewId: z.string().uuid(),
})

type InterviewIdParam = z.infer<typeof interviewIdParamSchema>

@Controller('/answer-questions/interview/:interviewId')
export class FetchAnswersByInterviewIdController {
  constructor(
    private fetchAnswersByInterviewId: FetchAnswersByInterviewIdUseCase,
  ) {}

  @Get()
  async handle(
    @CurrentUser() user: UserPayload,
    @Param(new ZodValidationPipe(interviewIdParamSchema)) params: InterviewIdParam,
  ) {
    const result = await this.fetchAnswersByInterviewId.execute({
      interviewId: params.interviewId,
      accountId: user.sub,
    })

    return result.value
  }
}
