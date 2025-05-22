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
import { EditOptionAnswerUseCase } from '@/domain/use-cases/option-answer/edit-option-answer'

const editOptionAnswerBodySchema = z.object({
  title: z.string().optional(),
  num: z.number().optional(),
})

const bodyValidationPipe = new ZodValidationPipe(editOptionAnswerBodySchema)

type EditOptionAnswerBodySchema = z.infer<typeof editOptionAnswerBodySchema>

@Controller('/option-answers/:id')
export class EditOptionAnswerController {
  constructor(private editOptionAnswer: EditOptionAnswerUseCase) {}

  @Put()
  @HttpCode(204)
  async handle(
    @CurrentUser() user: UserPayload,
    @Body(bodyValidationPipe) body: EditOptionAnswerBodySchema,
    @Param('id') optionId: string,
  ) {
    const { title, num } = body
    const accountId = user.sub

    if (!title && !num) {
      throw new BadRequestException()
    }

    const result = await this.editOptionAnswer.execute({
      optionId,
      accountId,
      optionTitle: title,
      optionNum: num,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }
  }
}
