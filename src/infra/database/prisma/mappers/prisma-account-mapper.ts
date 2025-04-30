import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Account } from '@/domain/entities/account'
import { User as PrismaUser, Prisma } from 'prisma'
export class PrismaAccountMapper {
  static toDomain(raw: PrismaUser): Account {
    return Account.create(
      {
        name: raw.name,
        email: raw.email,
        password: raw.password,
      },
      new UniqueEntityID(raw.id),
    )
  }
  static toPrisma(account: Account): Prisma.UserUncheckendCreateInput {
    return {
      id: account.id.toString(),
      name: account.name,
      email: account.email,
      password: account.password,
      slug: account.slug.value,
    }
  }
}
