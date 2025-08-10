import { CreateSurveyUseCase } from '@/domain/use-cases/survey/create-survey'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import {
  BadRequestException,
  Body,
  Controller,
  Post,
} from '@nestjs/common'
import { z } from 'zod'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import { CreateQuestionUseCase } from '@/domain/use-cases/question/create-question'
import { CreateOptionAnswerUseCase } from '@/domain/use-cases/option-answer/create-option-answer'

const surveyBodySchema = z.object({
  title: z.string(),
  location: z.string(),
  type: z.string(),
  questions: z
    .object({
      questionTitle: z.string(),
      questionNum: z.number(),
      answers: z
        .object({
          optionTitle: z.string(),
          optionNum: z.number(),
        })
        .array(),
    })
    .array(),
})

type SurveyBodySchema = z.infer<typeof surveyBodySchema>

@Controller('/surveys')
export class CreateSurveyController {
  constructor(
    private survey: CreateSurveyUseCase,
    private questionUseCase: CreateQuestionUseCase,
    private createOptionAnswer: CreateOptionAnswerUseCase,
  ) {}

  @Post()
  async handle(
    @CurrentUser()
    user: UserPayload,
    @Body(new ZodValidationPipe(surveyBodySchema))
    body: SurveyBodySchema,
  ) {
    const { title, location, type, questions } = body
    const userId = user.sub

    const result = await this.survey.execute({
      title,
      location,
      type,
      accountId: userId,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }

    await Promise.all(
      questions.map(async (question) => {
        const { questionNum, questionTitle } = question
        const questionResponse = await this.questionUseCase.execute({
          questionTitle,
          questionNum,
          surveyId: result.value.survey.id.toString(),
          accountId: userId,
        })

        if (questionResponse.isLeft()) {
          throw new BadRequestException()
        }
        await Promise.all(
          question.answers.map(async (answer) => {
            const { optionTitle, optionNum } = answer
            const createOption = await this.createOptionAnswer.execute({
              optionTitle,
              optionNum,
              accountId: userId,
              questionId: questionResponse.value.question.id.toString(),
            })
            if (createOption.isLeft()) {
              throw new BadRequestException()
            }
          }),
        )
      }),
    )
  }
}
