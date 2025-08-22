import { CreateInterviewUseCase } from '@/domain/use-cases/interview/create-interview'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { BadRequestException, Body, Controller, Post } from '@nestjs/common'
import { z } from 'zod'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import { CreateAnswerQuestionUseCase } from '@/domain/use-cases/answer-question/create-answer-question'

const interviewBodySchema = z.object({
  surveyId: z.string().uuid(),
  answers: 
    z.object({
      questionId: z.string().uuid(),
      answerId: z.string().uuid(),
    }).array(),
})

type InterviewBodySchema = z.infer<typeof interviewBodySchema>

@Controller('/interviews')
export class CreateInterviewController {
  constructor(
    private interview: CreateInterviewUseCase,
    private answerquestion: CreateAnswerQuestionUseCase,
  ) {}

  @Post()
  async handle(
    @CurrentUser() user: UserPayload,
    @Body(new ZodValidationPipe(interviewBodySchema))
    body: InterviewBodySchema,
  ) {
    const { surveyId, answers } = body
    const userId = user.sub
    console.log(body)

    const result = await this.interview.execute({
      surveyId,
      accountId: userId,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }

    const interviewId = result.value.interview.id.toString()

    await Promise.all(
      answers.map(async (answer) => {
        const { questionId, answerId } = answer
        const answerResponse = await this.answerquestion.execute({
          interviewId,
          questionId,
          optionAnswerId: answerId,
          accountId: userId,
        })

        if (answerResponse.isLeft()) {
          throw new BadRequestException('Failed to create answer question')
        }
      }),
    )
  }
}
