import { Either } from '@/core/types/either'

function describeValue(value: unknown): string {
  if (value instanceof Error) return `${value.name}: ${value.message}`

  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

export function unwrapRight<L, R>(result: Either<L, R>): R {
  if (result.isLeft()) {
    throw new Error(
      `Expected Right, received Left(${describeValue(result.value)})`,
    )
  }

  return result.value
}

export function unwrapLeft<L, R>(result: Either<L, R>): L {
  if (result.isRight()) {
    throw new Error(
      `Expected Left, received Right(${describeValue(result.value)})`,
    )
  }

  return result.value
}
