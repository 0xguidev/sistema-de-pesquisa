import { SetMetadata } from '@nestjs/common'
import { AccountRole } from '@/domain/entities/account'

export const ROLES_KEY = 'roles'

/** Declares the roles accepted by a controller or handler. */
export const Roles = (...roles: AccountRole[]) => SetMetadata(ROLES_KEY, roles)
