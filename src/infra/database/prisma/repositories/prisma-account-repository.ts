import { Account } from '@/domain/entities/account'
import { AccountRepository } from '@/domain/repositories/account-repository'
import { PrismaService } from '../prisma.service'
import { PrismaAccountMapper } from '../mappers/prisma-account-mapper'
import { Injectable } from '@nestjs/common'

@Injectable()
export class PrismaAccountRepository implements AccountRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Account | null> {
    const account = await this.prisma.user.findUnique({
      where: {
        id,
      },
    })

    if (!account) {
      return null
    }

    return PrismaAccountMapper.toDomain(account)
  }

  async findByEmail(email: string): Promise<Account | null> {
    const normalizedEmail = email.trim().toLowerCase()

    const account = await this.prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    })

    if (!account) {
      return null
    }

    return PrismaAccountMapper.toDomain(account)
  }

  async create(account: Account): Promise<void> {
    const data = PrismaAccountMapper.toPrisma(account)

    await this.prisma.user.create({
      data,
    })
  }

  async update(account: Account): Promise<void> {
    const data = PrismaAccountMapper.toPrisma(account)

    await this.prisma.user.update({
      where: {
        id: account.id.toString(),
      },
      data,
    })
  }

  async updateAndRevokeTokens(
    account: Account,
    revokedBefore: Date,
  ): Promise<void> {
    const data = PrismaAccountMapper.toPrisma(account)
    const accountId = account.id.toString()

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: accountId }, data }),
      this.prisma.revokedTokenSubject.upsert({
        where: { accountId },
        create: { accountId, revokedBefore },
        update: { revokedBefore },
      }),
      this.prisma.session.updateMany({
        where: { accountId, revokedAt: null },
        data: { revokedAt: revokedBefore },
      }),
    ])
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: {
        id,
      },
    })
  }

  async deleteAndRevokeTokens(id: string, revokedBefore: Date): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.user.delete({ where: { id } }),
      this.prisma.revokedTokenSubject.upsert({
        where: { accountId: id },
        create: { accountId: id, revokedBefore },
        update: { revokedBefore },
      }),
    ])
  }
}
