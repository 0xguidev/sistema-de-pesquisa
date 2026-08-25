export abstract class PasswordCompromiseChecker {
  abstract isCompromised(password: string): Promise<boolean>
}
