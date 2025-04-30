import { CreateInterviewUseCase } from '@/domain/use-cases/interview/create-interview'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { BadRequestException, Body, Controller, Post } from '@nestjs/common'
import { z } from 'zod'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'

const interviewBodySchema = z.object({
  surveyId: z.string().uuid(),
})

type InterviewBodySchema = z.infer<typeof interviewBodySchema>

@Controller('/interviews')
export class CreateInterviewController {
  constructor(private interview: CreateInterviewUseCase) {}

  @Post()
  async handle(
    @CurrentUser() user: UserPayload,
    @Body(new ZodValidationPipe(interviewBodySchema))
    body: InterviewBodySchema,
  ) {
    const { surveyId } = body
    const userId = user.sub

    const result = await this.interview.execute({
      surveyId,
      accountId: userId,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }
  }
}
