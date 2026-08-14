import { Account } from '../entities/account'

export abstract class AccountRepository {
  abstract findById(id: string): Promise<Account | null>
  abstract findByEmail(email: string): Promise<Account | null>
  abstract create(student: Account): Promise<void>
  abstract update(account: Account): Promise<void>
  abstract updateAndRevokeTokens(
    account: Account,
    revokedBefore: Date,
  ): Promise<void>
  abstract delete(id: string): Promise<void>
  abstract deleteAndRevokeTokens(id: string, revokedBefore: Date): Promise<void>
}
