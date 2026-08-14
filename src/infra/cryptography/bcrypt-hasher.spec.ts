import { ConfigService } from '@nestjs/config'
import { hash } from 'bcryptjs'
import { describe, expect, it } from 'vitest'
import { EnvService } from '../env/env.service'
import { BcryptHasher } from './bcrypt-hasher'

function makeHasher(cost = 10) {
  const configService = new ConfigService({ BCRYPT_COST: cost })
  return new BcryptHasher(new EnvService(configService as never))
}

describe('BcryptHasher', () => {
  it('creates a bcrypt hash with the configured cost', async () => {
    const hasher = makeHasher(10)
    const hashed = await hasher.hash('plain-password')

    expect(hashed).toMatch(/^\$2[aby]\$10\$/)
    expect(hashed).not.toContain('plain-password')
  })

  it('compares the correct password', async () => {
    const hasher = makeHasher()
    const hashed = await hasher.hash('correct-password')

    await expect(hasher.compare('correct-password', hashed)).resolves.toBe(true)
  })

  it('rejects an incorrect password', async () => {
    const hasher = makeHasher()
    const hashed = await hasher.hash('correct-password')

    await expect(hasher.compare('incorrect-password', hashed)).resolves.toBe(
      false,
    )
  })

  it('accepts existing bcrypt hashes and identifies an old cost for rehash', async () => {
    const hasher = makeHasher(10)
    const oldHash = await hash('correct-password', 8)

    await expect(hasher.compare('correct-password', oldHash)).resolves.toBe(
      true,
    )
    expect(hasher.needsRehash(oldHash)).toBe(true)
  })

  it('does not rehash a hash with the current or a higher cost', async () => {
    const hasher = makeHasher(10)
    const currentHash = await hash('correct-password', 10)
    const strongerHash = await hash('correct-password', 11)

    expect(hasher.needsRehash(currentHash)).toBe(false)
    expect(hasher.needsRehash(strongerHash)).toBe(false)
  })
})
