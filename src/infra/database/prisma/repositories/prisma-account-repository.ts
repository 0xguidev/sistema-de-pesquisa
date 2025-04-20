import { Account } from '@/domain/entities/account'
import { PrismaService } from '../prisma.service'
import { PrismaAccountMapper } from '../mappers/prisma-account-mapper'
import { Injectable } from '@nestjs/common'

@Injectable()
export class PrismaAccountRepository {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string): Promise<Account | null> {
    const account = await this.prisma.user.findUnique({
      where: {
        email,
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
}
