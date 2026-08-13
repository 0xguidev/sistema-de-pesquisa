import { Account } from '../entities/account'

export abstract class AccountRepository {
  abstract findById(id: string): Promise<Account | null>
  abstract findByEmail(email: string): Promise<Account | null>
  abstract create(student: Account): Promise<void>
  abstract update(account: Account): Promise<void>
}
