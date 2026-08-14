import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AccountRole } from '@/domain/entities/account'
import { UserPayload } from './jwt.strategy'
import { ROLES_KEY } from './roles'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

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
      throw new ForbiddenException('Insufficient role')
    }

    return true
  }
}
