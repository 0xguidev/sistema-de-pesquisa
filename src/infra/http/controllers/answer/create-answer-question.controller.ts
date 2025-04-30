import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { BadRequestException, Body, Controller, Post } from '@nestjs/common'
import { z } from 'zod'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import { CreateAnswerQuestionUseCase } from '@/domain/use-cases/answer-question/create-answer-question'

const answerquestionBodySchema = z.object({
  interviewId: z.string().uuid(),
  questionId: z.string().uuid(),
  optionAnswerId: z.string().uuid(),
})

type AnswerQuestionBodySchema = z.infer<typeof answerquestionBodySchema>

@Controller('/answer-questions')
export class CreateAnswerQuestionController {
  constructor(private answerquestion: CreateAnswerQuestionUseCase) {}

  @Post()
  async handle(
    @CurrentUser() user: UserPayload,
    @Body(new ZodValidationPipe(answerquestionBodySchema))
    body: AnswerQuestionBodySchema,
  ) {
    const { interviewId, questionId, optionAnswerId } = body
    const userId = user.sub

    const result = await this.answerquestion.execute({
      interviewId,
      questionId,
      optionAnswerId,
      accountId: userId,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }
  }
}
