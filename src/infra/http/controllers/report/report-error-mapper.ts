import { InvalidRequestError } from '@/core/errors/errors/invalid-request-error'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common'
import {
  ReportGlobalCapacityError,
  ReportTimeoutError,
  ReportUserCapacityError,
} from '@/domain/use-cases/report/report-protection'

export function throwReportHttpError(error: unknown): never {
  if (error instanceof ResourceNotFoundError) {
    throw new NotFoundException(error.message)
  }

  if (error instanceof InvalidRequestError) {
    throw new BadRequestException(error.message)
  }

  if (error instanceof ReportUserCapacityError) {
    throw new HttpException(error.message, HttpStatus.TOO_MANY_REQUESTS)
  }
  if (
    error instanceof ReportGlobalCapacityError ||
    error instanceof ReportTimeoutError
  ) {
    throw new ServiceUnavailableException(error.message)
  }

  throw error
}
