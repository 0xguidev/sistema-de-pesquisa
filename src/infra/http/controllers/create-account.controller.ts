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
import { Public } from 'src/infra/auth/public'
import { ZodValidationPipe } from '../pipes/zod-validation-pipe'
import { z } from 'zod'
import { AccountAlreadyExistsError } from 'src/domain/use-cases/error/account-already-exists.error'

const createAccountBodySchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string(),
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
