import { faker } from '@faker-js/faker'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'

import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { Account, AccountProps } from '@/domain/entities/account'
import { PrismaAccountMapper } from '@/infra/database/prisma/mappers/prisma-account-mapper'

export function makeAccount(
  override: Partial<AccountProps> = {},
  id?: UniqueEntityID,
) {
  const account = Account.create(
    {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      ...override,
    },
    id,
  )

  return account
}

@Injectable()
export class AccountFactory {
  constructor(private prisma: PrismaService) {}

  async makePrismaStudent(data: Partial<AccountProps> = {}): Promise<Account> {
    const account = makeAccount(data)

    await this.prisma.user.create({
      data: PrismaAccountMapper.toPrisma(account),
    })

    return account
  }
}
