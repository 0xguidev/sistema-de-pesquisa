import { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { RolesGuard } from './roles.guard'

function contextFor(role?: 'USER' | 'ADMIN') {
  return {
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
    switchToHttp: () => ({
      getRequest: () => ({ user: role ? { role } : undefined }),
    }),
  } as unknown as ExecutionContext
}

describe('RolesGuard', () => {
  it('allows a regular user where USER is required', () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(['USER']) }
    const guard = new RolesGuard(reflector as unknown as Reflector)

    expect(guard.canActivate(contextFor('USER'))).toBe(true)
  })

  it('allows an administrator where ADMIN is required', () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(['ADMIN']) }
    const guard = new RolesGuard(reflector as unknown as Reflector)

    expect(guard.canActivate(contextFor('ADMIN'))).toBe(true)
  })

  it('denies a regular user where ADMIN is required', () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(['ADMIN']) }
    const guard = new RolesGuard(reflector as unknown as Reflector)

    expect(() => guard.canActivate(contextFor('USER'))).toThrow(
      'Insufficient role',
    )
  })

  it('does not impose RBAC where no role requirement was declared', () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(undefined) }
    const guard = new RolesGuard(reflector as unknown as Reflector)

    expect(guard.canActivate(contextFor('USER'))).toBe(true)
  })
})
