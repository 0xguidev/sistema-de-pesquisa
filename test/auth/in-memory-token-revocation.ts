import { TokenRevocation } from '@/domain/auth/token-revocation'

export class InMemoryTokenRevocation implements TokenRevocation {
  public revokedBeforeByAccountId = new Map<string, Date>()

  async revokeAllForAccount(accountId: string, revokedBefore = new Date()) {
    this.revokedBeforeByAccountId.set(accountId, revokedBefore)
  }

  async isTokenRevoked(accountId: string, issuedAtSeconds: number) {
    const revokedBefore = this.revokedBeforeByAccountId.get(accountId)
    return (
      revokedBefore !== undefined &&
      issuedAtSeconds * 1000 <= revokedBefore.getTime()
    )
  }
}
