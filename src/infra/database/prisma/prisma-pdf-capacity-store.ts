import { Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { PdfCapacityStore } from '@/domain/use-cases/report/pdf-capacity-store'
import { PrismaService } from './prisma.service'

const CAPACITY_LOCK_KEY = 'report:pdf:capacity'

@Injectable()
export class PrismaPdfCapacityStore implements PdfCapacityStore {
  constructor(private readonly prisma: PrismaService) {}

  acquire(input: {
    accountId: string
    globalLimit: number
    userLimit: number
    leaseMs: number
  }) {
    return this.prisma.$transaction(async (tx) => {
      // Every replica takes the same transaction-scoped lock, making cleanup,
      // limit checks and insertion one atomic capacity decision.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${CAPACITY_LOCK_KEY}))`

      const now = new Date()
      await tx.pdfRenderLease.deleteMany({
        where: { expiresAt: { lte: now } },
      })

      const userCount = await tx.pdfRenderLease.count({
        where: { accountId: input.accountId },
      })
      if (userCount >= input.userLimit) {
        return { acquired: false as const, reason: 'user' as const }
      }

      const globalCount = await tx.pdfRenderLease.count()
      if (globalCount >= input.globalLimit) {
        return { acquired: false as const, reason: 'global' as const }
      }

      const leaseId = randomUUID()
      await tx.pdfRenderLease.create({
        data: {
          id: leaseId,
          accountId: input.accountId,
          expiresAt: new Date(now.getTime() + input.leaseMs),
        },
      })
      return { acquired: true as const, leaseId }
    })
  }

  async release(leaseId: string): Promise<void> {
    await this.prisma.pdfRenderLease.deleteMany({ where: { id: leaseId } })
  }
}
