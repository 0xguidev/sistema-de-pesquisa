import { UseCaseError } from '../use-case-error'

export class RepositoryError extends Error implements UseCaseError {
  constructor(message = 'Repository operation failed') {
    super(message)
    this.name = 'RepositoryError'
  }
}
