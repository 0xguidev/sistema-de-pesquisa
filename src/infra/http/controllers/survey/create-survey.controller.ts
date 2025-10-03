import { CreateSurveyUseCase } from '@/domain/use-cases/survey/create-survey'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { BadRequestException, Body, Controller, Post } from '@nestjs/common'
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
      conditionalRules: z
        .object({
          questionNum: z.number().optional(),
          optionNum: z.number().optional(),
        })
        .array()
        .optional(),
      options: z
        .object({
          optionTitle: z.string(),
          optionNum: z.number(),
        })
        .array(),
    })
    .array()
    .optional(),
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
      throw new BadRequestException(
        'Falha ao criar pesquisa. Verifique os dados fornecidos.',
      )
    }

    if (questions) {
      for (const question of questions) {
        const { questionNum, questionTitle, options, conditionalRules } = question
        const mappedConditionalRules = conditionalRules
          ?.filter(
            (rule) =>
              rule.questionNum !== undefined && rule.optionNum !== undefined,
          )
          .map((rule) => ({
            dependsOnQuestionNumber: rule.questionNum!,
            dependsOnOptionNumber: rule.optionNum!,
          }))
        const questionResponse = await this.questionUseCase.execute({
          questionTitle,
          questionNum,
          surveyId: result.value.survey.id.toString(),
          accountId: userId,
          conditionalRules: mappedConditionalRules,
        })

        if (questionResponse.isLeft()) {
          throw new BadRequestException(
            'Falha ao criar pergunta. Verifique os dados da pergunta e regras condicionais.',
          )
        }

        const createdQuestion = questionResponse.value.question

        for (const answer of options) {
          const { optionTitle, optionNum } = answer
          const createOption = await this.createOptionAnswer.execute({
            optionTitle,
            optionNum,
            accountId: userId,
            questionId: createdQuestion.id.toString(),
          })
          if (createOption.isLeft()) {
            throw new BadRequestException('Falha ao criar opção de resposta.')
          }
        }
      }
    }

    return {
      message: 'Pesquisa criada com sucesso.',
      surveyId: result.value.survey.id.toString(),
    }
  }
}
