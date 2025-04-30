import { CreateQuestionUseCase } from '@/domain/use-cases/question/create-question'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { BadRequestException, Body, Controller, Post } from '@nestjs/common'
import { z } from 'zod'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'

const questionBodySchema = z.object({
  questionTitle: z.string(),
  questionNum: z.number(),
  surveyId: z.string(),
})

type QuestionBodySchema = z.infer<typeof questionBodySchema>

@Controller('/questions')
export class CreateQuestionController {
  constructor(private question: CreateQuestionUseCase) {}

  @Post()
  async handle(
    @CurrentUser() user: UserPayload,
    @Body(new ZodValidationPipe(questionBodySchema))
    body: QuestionBodySchema,
  ) {
    const { questionTitle, questionNum, surveyId } = body
    const userId = user.sub

    const result = await this.question.execute({
      questionTitle,
      questionNum,
      surveyId,
      accountId: userId,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }
  }
}
