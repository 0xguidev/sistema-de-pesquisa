import { Account } from '@/domain/entities/account'
import { AccountRepository } from '@/domain/repositories/account-repository'

export class InMemoryAccountRepository implements AccountRepository {
  public items: Account[] = []

  async findByEmail(email: string) {
    const account = this.items.find((item) => item.email === email)

    if (!account) {
      return null
    }

    return account
  }

  async create(account: Account) {
    this.items.push(account)
  }
}
