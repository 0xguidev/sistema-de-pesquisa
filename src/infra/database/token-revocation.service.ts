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
  ): Promise<boolean> {
    const revocation = await this.prisma.revokedTokenSubject.findUnique({
      where: { accountId },
      select: { revokedBefore: true },
    })

    return (
      revocation !== null &&
      issuedAtSeconds * 1000 <= revocation.revokedBefore.getTime()
    )
  }
}
