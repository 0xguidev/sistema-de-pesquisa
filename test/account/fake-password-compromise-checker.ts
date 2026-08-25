import { PasswordCompromiseChecker } from '@/domain/account/password-compromise-checker'

export class FakePasswordCompromiseChecker implements PasswordCompromiseChecker {
  compromised = new Set<string>()

  async isCompromised(password: string): Promise<boolean> {
    return this.compromised.has(password)
  }
}
