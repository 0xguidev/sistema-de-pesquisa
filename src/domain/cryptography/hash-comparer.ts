export abstract class HashComparer {
  abstract compare(plain: string, hash: string): Promise<boolean>
  abstract needsRehash(hash: string): boolean
}
