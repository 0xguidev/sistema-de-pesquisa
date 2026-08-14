import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Post,
  UsePipes,
} from '@nestjs/common'
import { RegisterAccountUseCase } from '@/domain/use-cases/account/create-account'
import { Public } from '@/infra/auth/public'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import { z } from 'zod'
import { AccountAlreadyExistsError } from '@/domain/use-cases/error/account-already-exists.error'
import {
  ACCOUNT_NAME_MAX_LENGTH,
  ACCOUNT_NAME_MIN_LENGTH,
  ACCOUNT_PASSWORD_MAX_LENGTH,
  ACCOUNT_PASSWORD_MIN_LENGTH,
  isAccountPasswordValid,
} from '@/domain/account/account-policy'

const createAccountBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(ACCOUNT_NAME_MIN_LENGTH)
    .max(ACCOUNT_NAME_MAX_LENGTH),
  email: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(ACCOUNT_PASSWORD_MIN_LENGTH)
    .max(ACCOUNT_PASSWORD_MAX_LENGTH)
    .refine(isAccountPasswordValid),
})

type CreateAccountBodySchema = z.infer<typeof createAccountBodySchema>

@Controller('/accounts')
@Public()
export class CreateAccountController {
  constructor(private registerAccount: RegisterAccountUseCase) {}

  @Post()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(createAccountBodySchema))
  async handle(@Body() body: CreateAccountBodySchema) {
    const { name, email, password } = body
    const result = await this.registerAccount.execute({
      name,
      email,
      password,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case AccountAlreadyExistsError:
          throw new ConflictException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
  }
}
