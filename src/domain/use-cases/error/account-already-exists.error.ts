import { UseCaseError } from 'src/core/errors/use-case-error'

export class AccountAlreadyExistsError extends Error implements UseCaseError {
  constructor(identifier: string) {
    super(`Account "${identifier}" already exists.`)
  }
}
