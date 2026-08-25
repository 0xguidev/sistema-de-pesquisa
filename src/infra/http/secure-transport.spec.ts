import { describe, expect, it, vi } from 'vitest'
import { requireHttps } from './secure-transport'
import { Request, Response } from 'express'

describe('secure transport middleware', () => {
  it('rejects HTTP without emitting HSTS', () => {
    const send = vi.fn()
    const status = vi.fn(() => ({ send }))
    const setHeader = vi.fn()
    const next = vi.fn()

    requireHttps(
      { secure: false } as Request,
      { status, setHeader } as unknown as Response,
      next,
    )

    expect(status).toHaveBeenCalledWith(426)
    expect(send).toHaveBeenCalledWith('HTTPS is required')
    expect(setHeader).not.toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()
  })

  it('emits HSTS and continues for HTTPS', () => {
    const setHeader = vi.fn()
    const next = vi.fn()

    requireHttps(
      { secure: true } as Request,
      { setHeader } as unknown as Response,
      next,
    )

    expect(setHeader).toHaveBeenCalledWith(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    )
    expect(next).toHaveBeenCalledOnce()
  })
})
