import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Optional,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AccountRole } from '@/domain/entities/account'
import { UserPayload } from './jwt.strategy'
import { ROLES_KEY } from './roles'
import { SecurityLogger } from '../observability/security-logger.service'
import { SecurityEvent } from '../observability/security-events'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Optional() private securityLogger?: SecurityLogger,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AccountRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    )

    if (!requiredRoles?.length) {
      return true
    }

    const request = context.switchToHttp().getRequest<{ user?: UserPayload }>()
    if (!request.user || !requiredRoles.includes(request.user.role)) {
      this.securityLogger?.audit(SecurityEvent.AUTHORIZATION_FAILURE, {
        principal_id: this.securityLogger.pseudonym(request.user?.sub),
        required_roles: requiredRoles,
        actual_role: request.user?.role,
        reason: 'insufficient_role',
      })
      throw new ForbiddenException('Insufficient role')
    }

    return true
  }
}
