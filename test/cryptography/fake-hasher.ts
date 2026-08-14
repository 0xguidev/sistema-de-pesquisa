import { HashComparer } from '@/domain/cryptography/hash-comparer'
import { HashGenerator } from '@/domain/cryptography/hash-generator'

export class FakeHasher implements HashGenerator, HashComparer {
  public shouldRehash = false

  async hash(plain: string): Promise<string> {
    return plain.concat('-hashed')
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return plain.concat('-hashed') === hash
  }

  needsRehash(): boolean {
    return this.shouldRehash
  }
}
