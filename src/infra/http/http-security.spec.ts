import { describe, expect, it, vi } from 'vitest'
import { Request, Response } from 'express'
import { defensiveHeaders } from './http-security'

describe('defensive HTTP headers', () => {
  it('sets MIME, framing, referrer and content security policies', () => {
    const setHeader = vi.fn()
    const next = vi.fn()

    defensiveHeaders({} as Request, { setHeader } as unknown as Response, next)

    expect(setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff')
    expect(setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY')
    expect(setHeader).toHaveBeenCalledWith('Referrer-Policy', 'no-referrer')
    expect(setHeader).toHaveBeenCalledWith(
      'Content-Security-Policy',
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    )
    expect(next).toHaveBeenCalledOnce()
  })
})
