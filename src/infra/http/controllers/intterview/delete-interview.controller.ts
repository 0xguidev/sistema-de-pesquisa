import { DeleteInterviewUseCase } from '@/domain/use-cases/interview/delete-interview'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import {
  BadRequestException,
  Controller,
  Delete,
  HttpCode,
  Param,
} from '@nestjs/common'

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
      throw new BadRequestException()
    }
  }
}
