export type PdfCapacityRejection = 'user' | 'global'

export type PdfCapacityResult =
  | { acquired: true; leaseId: string }
  | { acquired: false; reason: PdfCapacityRejection }

export abstract class PdfCapacityStore {
  abstract acquire(input: {
    accountId: string
    globalLimit: number
    userLimit: number
    leaseMs: number
  }): Promise<PdfCapacityResult>

  abstract release(leaseId: string): Promise<void>
}
