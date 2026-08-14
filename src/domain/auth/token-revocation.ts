export abstract class TokenRevocation {
  abstract revokeAllForAccount(accountId: string): Promise<void>
  abstract isAccountRevoked(accountId: string): Promise<boolean>
}
