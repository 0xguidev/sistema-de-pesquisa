import { SecurityLogger } from './security-logger.service'
import { SecurityEvent } from './security-events'
import { requestContext } from './request-context'

describe('SecurityLogger', () => {
  it('emits correlated JSON and removes secrets recursively', () => {
    const output = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    const logger = new SecurityLogger()

    requestContext.run({ requestId: 'req-test', userId: 'account-1' }, () => {
      logger.audit(SecurityEvent.LOGIN_FAILURE, {
        password: 'never-log-me',
        access_token: 'access-secret',
        nested: { refreshToken: 'refresh-secret' },
        message: 'Bearer abc.def.ghi',
        databaseUrl: 'postgresql://admin:secret@db/app',
      })
    })

    const line = String(output.mock.calls[0][0])
    const record = JSON.parse(line)
    expect(record).toMatchObject({
      category: 'audit',
      event_code: SecurityEvent.LOGIN_FAILURE,
      request_id: 'req-test',
    })
    expect(record.user_id).not.toBe('account-1')
    expect(line).not.toContain('never-log-me')
    expect(line).not.toContain('access-secret')
    expect(line).not.toContain('refresh-secret')
    expect(line).not.toContain('admin:secret')
    expect(line).not.toContain('abc.def.ghi')
    output.mockRestore()
  })
})
