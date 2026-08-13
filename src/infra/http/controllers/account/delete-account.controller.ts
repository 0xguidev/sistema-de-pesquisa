import { Controller, Delete, HttpCode, NotFoundException } from '@nestjs/common'
import { DeleteAccountUseCase } from '@/domain/use-cases/account/delete-account'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'

@Controller('/accounts')
export class DeleteAccountController {
  constructor(private deleteAccount: DeleteAccountUseCase) {}

  @Delete()
  @HttpCode(204)
  async handle(@CurrentUser() user: UserPayload) {
    const accountId = user.sub

    const result = await this.deleteAccount.execute({ accountId })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof ResourceNotFoundError) {
        throw new NotFoundException(error.message)
      }
    }
  }
}
