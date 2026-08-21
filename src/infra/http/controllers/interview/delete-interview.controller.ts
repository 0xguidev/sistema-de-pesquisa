import { DeleteInterviewUseCase } from '@/domain/use-cases/interview/delete-interview'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import {
  Controller,
  Delete,
  ForbiddenException,
  HttpCode,
  Param,
  NotFoundException,
} from '@nestjs/common'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'

@Controller('/interviews/:id')
export class DeleteInterviewController {
  constructor(private deleteInterview: DeleteInterviewUseCase) {}

  @Delete()
  @HttpCode(204)
  async handle(
    @CurrentUser() user: UserPayload,
    @Param('id') interviewId: string,
  ) {
    const userId = user.sub

    const result = await this.deleteInterview.execute({
      accountId: userId,
      interviewId,
    })

    if (result.isLeft()) {
      if (result.value instanceof ResourceNotFoundError) {
        throw new NotFoundException(result.value.message)
      }
      if (result.value instanceof NotAllowedError) {
        throw new ForbiddenException(result.value.message)
      }
    }
  }
}
