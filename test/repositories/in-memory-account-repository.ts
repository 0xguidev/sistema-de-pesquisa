import { Account } from '@/domain/entities/account'
import { AccountRepository } from '@/domain/repositories/account-repository'

export class InMemoryAccountRepository implements AccountRepository {
  public items: Account[] = []

  async findById(id: string) {
    const account = this.items.find((item) => item.id.toString() === id)

    if (!account) {
      return null
    }

    return account
  }

  async findByEmail(email: string) {
    const normalizedEmail = email.trim().toLowerCase()
    const account = this.items.find(
      (item) => item.email.trim().toLowerCase() === normalizedEmail,
    )

    if (!account) {
      return null
    }

    return account
  }

  async create(account: Account) {
    this.items.push(account)
  }

  async update(account: Account) {
    const index = this.items.findIndex((item) => item.id.equals(account.id))

    if (index >= 0) {
      this.items[index] = account
    }
  }

  async delete(id: string) {
    this.items = this.items.filter((item) => item.id.toString() !== id)
  }
}
