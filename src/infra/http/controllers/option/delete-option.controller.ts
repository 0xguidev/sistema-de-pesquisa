import { DeleteOptionAnswerUseCase } from '@/domain/use-cases/option-answer/delete-option-answer'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import {
  BadRequestException,
  Controller,
  Delete,
  HttpCode,
  Param,
} from '@nestjs/common'

@Controller('/option-answers/:id')
export class DeleteOptionAnswerController {
  constructor(private deleteOptionAnswer: DeleteOptionAnswerUseCase) {}

  @Delete()
  @HttpCode(204)
  async handle(
    @CurrentUser() user: UserPayload,
    @Param('id') optionAnswerId: string,
  ) {
    const userId = user.sub

    const result = await this.deleteOptionAnswer.execute({
      accountId: userId,
      optionAnswerId,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }
  }
}
