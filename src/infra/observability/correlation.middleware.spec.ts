import { CorrelationMiddleware } from './correlation.middleware'
import { requestContext } from './request-context'

describe('CorrelationMiddleware', () => {
  it('returns and exposes a safe client request id', () => {
    const response = { setHeader: vi.fn() }
    const request = {
      header: vi.fn().mockReturnValue('client-request-1'),
      method: 'GET',
      path: '/surveys',
      originalUrl: '/surveys?page=1',
    }
    const next = vi.fn(() => {
      expect(requestContext.getStore()?.requestId).toBe('client-request-1')
    })

    new CorrelationMiddleware().use(request as never, response as never, next)

    expect(response.setHeader).toHaveBeenCalledWith(
      'x-request-id',
      'client-request-1',
    )
  })
})
