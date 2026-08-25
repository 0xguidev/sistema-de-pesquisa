import { UseCaseError } from '@/core/errors/use-case-error'

export class PersistenceConflictError extends Error implements UseCaseError {
  constructor() {
    super('A persistence constraint was violated')
  }
}
