import { describe, expect, it, vi } from 'vitest'
import {
  ReportGlobalCapacityError,
  ReportProtection,
  ReportTimeoutError,
  ReportUserCapacityError,
} from './report-protection'
import { EnvService } from '@/infra/env/env.service'

function protection(overrides: Record<string, number> = {}) {
  const values: Record<string, number> = {
    REPORT_MAX_INTERVIEWS: 1000,
    REPORT_TIMEOUT_MS: 20,
    REPORT_MAX_TEXT_LENGTH: 5000,
    REPORT_MAX_QUESTIONS: 100,
    REPORT_MAX_OPTIONS_PER_QUESTION: 100,
    REPORT_MAX_DOCUMENT_BYTES: 1024 * 1024,
    REPORT_PDF_USER_CONCURRENCY: 1,
    REPORT_PDF_GLOBAL_CONCURRENCY: 2,
    ...overrides,
  }
  return new ReportProtection({
    get: (key: string) => values[key],
  } as EnvService)
}

describe('ReportProtection PDF capacity', () => {
  it('rejects a report instead of silently truncating interviews', () => {
    const sut = protection({ REPORT_MAX_INTERVIEWS: 10 })

    expect(() => sut.validateInterviews({ data: [], total: 11 })).toThrow(
      'limite de 10 entrevistas (total: 11)',
    )
  })

  it('rejects concurrent work from the same user with 429 domain error and releases the slot', async () => {
    const sut = protection()
    let release!: () => void
    const first = sut.withPdfSlot(
      'user-1',
      () =>
        new Promise<void>((resolve) => {
          release = resolve
        }),
    )

    await expect(
      sut.withPdfSlot('user-1', async () => undefined),
    ).rejects.toBeInstanceOf(ReportUserCapacityError)
    release()
    await first
    await expect(sut.withPdfSlot('user-1', async () => 'ok')).resolves.toBe(
      'ok',
    )
  })

  it('rejects work when global capacity is exhausted', async () => {
    const sut = protection({ REPORT_PDF_GLOBAL_CONCURRENCY: 1 })
    let release!: () => void
    const first = sut.withPdfSlot(
      'user-1',
      () =>
        new Promise<void>((resolve) => {
          release = resolve
        }),
    )
    await expect(
      sut.withPdfSlot('user-2', async () => undefined),
    ).rejects.toBeInstanceOf(ReportGlobalCapacityError)
    release()
    await first
  })

  it('aborts timed out work and only then releases resources and capacity', async () => {
    vi.useFakeTimers()
    const sut = protection()
    let cleaned = false
    const running = sut.withPdfSlot(
      'user-1',
      (signal) =>
        new Promise<void>((resolve) => {
          signal.addEventListener('abort', () => {
            cleaned = true
            resolve()
          })
        }),
    )
    const assertion = expect(running).rejects.toBeInstanceOf(ReportTimeoutError)
    await vi.advanceTimersByTimeAsync(20)
    await assertion
    expect(cleaned).toBe(true)
    await expect(
      sut.withPdfSlot('user-1', async () => 'released'),
    ).resolves.toBe('released')
    vi.useRealTimers()
  })
})
