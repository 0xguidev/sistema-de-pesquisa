import { EditQuestionUseCase } from '@/domain/use-cases/question/edit-question'
import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Param,
  Put,
} from '@nestjs/common'
import { z } from 'zod'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'

const editQuestionBodySchema = z.object({
  title: z.string().optional(),
  num: z.number().optional(),
})

const bodyValidationPipe = new ZodValidationPipe(editQuestionBodySchema)

type EditQuestionBodySchema = z.infer<typeof editQuestionBodySchema>

@Controller('/questions/:id')
export class EditQuestionController {
  constructor(private editQuestion: EditQuestionUseCase) {}

  @Put()
  @HttpCode(204)
  async handle(
    @CurrentUser() user: UserPayload,
    @Body(bodyValidationPipe) body: EditQuestionBodySchema,
    @Param('id') questionId: string,
  ) {
    const { title, num } = body
    const accountId = user.sub

    if (!title && !num) {
      throw new BadRequestException()
    }

    const result = await this.editQuestion.execute({
      questionId,
      accountId,
      questionTitle: title,
      questionNum: num,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }
  }
}
