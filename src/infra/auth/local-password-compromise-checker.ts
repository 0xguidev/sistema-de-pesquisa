import { PasswordCompromiseChecker } from '@/domain/account/password-compromise-checker'
import { Injectable } from '@nestjs/common'
import { createHash } from 'node:crypto'
import { EnvService } from '../env/env.service'

// SHA-256 only: neither configuration nor diagnostics need plaintext passwords.
const BUILT_IN_DIGESTS = new Set(
  ['password', 'password123', '12345678', 'qwerty123'].map((password) =>
    createHash('sha256').update(password).digest('hex'),
  ),
)

@Injectable()
export class LocalPasswordCompromiseChecker implements PasswordCompromiseChecker {
  private readonly digests: Set<string>

  constructor(env: EnvService) {
    const configured = env
      .get('COMPROMISED_PASSWORD_SHA256')
      .split(',')
      .map((digest) => digest.trim().toLowerCase())
      .filter((digest) => /^[a-f0-9]{64}$/.test(digest))
    this.digests = new Set([...BUILT_IN_DIGESTS, ...configured])
  }

  async isCompromised(password: string): Promise<boolean> {
    const digest = createHash('sha256').update(password).digest('hex')
    return this.digests.has(digest)
  }
}
