import { InvalidRequestError } from '@/core/errors/errors/invalid-request-error'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { BadRequestException, NotFoundException } from '@nestjs/common'

export function throwReportHttpError(error: unknown): never {
  if (error instanceof ResourceNotFoundError) {
    throw new NotFoundException(error.message)
  }

  if (error instanceof InvalidRequestError) {
    throw new BadRequestException(error.message)
  }

  throw error
}
