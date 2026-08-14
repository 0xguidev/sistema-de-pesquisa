import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  NotFoundException,
  Put,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common'
import { z } from 'zod'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { EditAccountUseCase } from '@/domain/use-cases/account/edit-account'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { AccountAlreadyExistsError } from '@/domain/use-cases/error/account-already-exists.error'
import {
  ACCOUNT_NAME_MAX_LENGTH,
  ACCOUNT_NAME_MIN_LENGTH,
  ACCOUNT_PASSWORD_MAX_LENGTH,
  ACCOUNT_PASSWORD_MIN_LENGTH,
  isAccountPasswordValid,
} from '@/domain/account/account-policy'

const editAccountBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(ACCOUNT_NAME_MIN_LENGTH)
    .max(ACCOUNT_NAME_MAX_LENGTH)
    .optional(),
  email: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase())
    .optional(),
  password: z
    .string()
    .min(ACCOUNT_PASSWORD_MIN_LENGTH)
    .max(ACCOUNT_PASSWORD_MAX_LENGTH)
    .refine(isAccountPasswordValid)
    .optional(),
})

const bodyValidationPipe = new ZodValidationPipe(editAccountBodySchema)

type EditAccountBodySchema = z.infer<typeof editAccountBodySchema>

@Controller('/accounts')
export class EditAccountController {
  constructor(private editAccount: EditAccountUseCase) {}

  @Put()
  @HttpCode(204)
  async handle(
    @CurrentUser() user: UserPayload,
    @Body(bodyValidationPipe) body: EditAccountBodySchema,
  ) {
    const { name, email, password } = body
    const accountId = user.sub

    if (!name && !email && !password) {
      throw new BadRequestException('At least one field must be provided')
    }

    const result = await this.editAccount.execute({
      accountId,
      name,
      email,
      password,
    })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof ResourceNotFoundError) {
        throw new NotFoundException(error.message)
      }

      if (error instanceof AccountAlreadyExistsError) {
        throw new ConflictException(error.message)
      }

      if (error instanceof ForbiddenException) {
        throw new ForbiddenException(error.message)
      }

      throw new BadRequestException(error.message)
    }
  }
}
