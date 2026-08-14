import { TokenRevocation } from '@/domain/auth/token-revocation'
import { Injectable } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service'

@Injectable()
export class TokenRevocationService implements TokenRevocation {
  constructor(private prisma: PrismaService) {}

  async revokeAllForAccount(accountId: string): Promise<void> {
    await this.prisma.revokedTokenSubject.upsert({
      where: { accountId },
      create: { accountId },
      update: { revokedAt: new Date() },
    })
  }

  async isAccountRevoked(accountId: string): Promise<boolean> {
    const revocation = await this.prisma.revokedTokenSubject.findUnique({
      where: { accountId },
      select: { accountId: true },
    })

    return revocation !== null
  }
}
