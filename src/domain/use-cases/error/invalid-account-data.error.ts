import { UseCaseError } from '@/core/errors/use-case-error'

export class InvalidAccountDataError extends Error implements UseCaseError {
  constructor(message: string) {
    super(message)
  }
}
