export abstract class TokenRevocation {
  abstract revokeAllForAccount(
    accountId: string,
    revokedBefore?: Date,
  ): Promise<void>
  abstract isTokenRevoked(
    accountId: string,
    issuedAtSeconds: number,
    sessionId?: string,
  ): Promise<boolean>
}
