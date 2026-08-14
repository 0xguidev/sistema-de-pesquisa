import { TokenRevocation } from '@/domain/auth/token-revocation'
import { Injectable } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service'

@Injectable()
export class TokenRevocationService implements TokenRevocation {
  constructor(private prisma: PrismaService) {}

  async revokeAllForAccount(
    accountId: string,
    revokedBefore = new Date(),
  ): Promise<void> {
    await this.prisma.revokedTokenSubject.upsert({
      where: { accountId },
      create: { accountId, revokedBefore },
      update: { revokedBefore },
    })
  }

  async isTokenRevoked(
    accountId: string,
    issuedAtSeconds: number,
    sessionId?: string,
  ): Promise<boolean> {
    const revocation = await this.prisma.revokedTokenSubject.findUnique({
      where: { accountId },
      select: { revokedBefore: true },
    })

    if (
      revocation === null ||
      issuedAtSeconds * 1000 > revocation.revokedBefore.getTime()
    ) {
      return false
    }

    // JWT iat has one-second precision. A session created after the exact
    // revocation instant must remain valid even when both timestamps fall in
    // the same second.
    if (sessionId) {
      const newerSession = await this.prisma.session.findFirst({
        where: {
          id: sessionId,
          accountId,
          createdAt: { gt: revocation.revokedBefore },
        },
        select: { id: true },
      })
      if (newerSession) return false
    }

    return true
  }
}
