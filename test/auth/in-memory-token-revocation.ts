import { TokenRevocation } from '@/domain/auth/token-revocation'

export class InMemoryTokenRevocation implements TokenRevocation {
  public revokedAccountIds = new Set<string>()

  async revokeAllForAccount(accountId: string): Promise<void> {
    this.revokedAccountIds.add(accountId)
  }

  async isAccountRevoked(accountId: string): Promise<boolean> {
    return this.revokedAccountIds.has(accountId)
  }
}
