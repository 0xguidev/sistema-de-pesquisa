import { UseCaseError } from '@/core/errors/use-case-error'

export class InvalidSurveyStructureError extends Error implements UseCaseError {
  constructor(message = 'Invalid survey structure') {
    super(message)
  }
}
