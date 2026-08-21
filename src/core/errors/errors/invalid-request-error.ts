import { UseCaseError } from '../use-case-error'

export class InvalidRequestError extends Error implements UseCaseError {
  constructor(message = 'Invalid request') {
    super(message)
    this.name = 'InvalidRequestError'
  }
}
