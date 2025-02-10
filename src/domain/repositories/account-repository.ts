import { Account } from '../entities/account'

export abstract class AccountRepository {
  abstract findByEmail(email: string): Promise<Account | null>
  abstract create(student: Account): Promise<void>
}
