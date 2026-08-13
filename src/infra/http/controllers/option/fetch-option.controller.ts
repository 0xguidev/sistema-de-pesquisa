import {
  Controller,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { GetOptionAnswerUseCase } from '@/domain/use-cases/option-answer/get-option-answer'

const optionIdParamSchema = z.object({
  optionId: z.string().uuid(),
})

type OptionIdParam = z.infer<typeof optionIdParamSchema>

@Controller('/option-answers/:optionId')
export class FetchOptionController {
  constructor(private fetchOption: GetOptionAnswerUseCase) {}

  @Get()
  async handle(
    @CurrentUser() user: UserPayload,
    @Param(new ZodValidationPipe(optionIdParamSchema)) params: OptionIdParam,
  ) {
    const { optionId } = params
    const accountId = user.sub

    const result = await this.fetchOption.execute({
      optionId,
      accountId,
    })

    if (result.isLeft()) {
      throw new NotFoundException()
    }

    const { optionanswer } = result.value

    return {
      option: {
        id: optionanswer.id.toString(),
        optionTitle: optionanswer.optionTitle,
        optionNum: optionanswer.optionNum,
        questionId: optionanswer.questionId.toString(),
        accountId: optionanswer.accountId.toString(),
        slug: optionanswer.slug.value,
        createdAt: optionanswer.createdAt,
        updatedAt: optionanswer.updateAt,
      },
    }
  }
}
