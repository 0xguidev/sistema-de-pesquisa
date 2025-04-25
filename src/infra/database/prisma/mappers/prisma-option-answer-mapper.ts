import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { OptionAnswer } from '@/domain/entities/option-answer'
import { Slug } from '@/domain/entities/value-objects/slug'
import { OptionAnswer as PrismaOption, Prisma } from '@prisma/client'

export class PrismaOptionAnswerMapper {
  static toDomain(raw: PrismaOption): OptionAnswer {
    if (!raw.questionId) {
      throw new Error('invalid option ')
    }

    return OptionAnswer.create(
      {
        optionTitle: raw.option,
        optionNum: raw.number,
        questionId: new UniqueEntityID(raw.questionId),
        accountId: new UniqueEntityID(raw.userId),
        slug: Slug.create(raw.slug),
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(
    option: OptionAnswer,
  ): Prisma.OptionAnswerUncheckedCreateInput {
    return {
      id: option.id.toString(),
      option: option.optionTitle,
      number: option.optionNum,
      questionId: option.questionId.toString(),
      userId: option.accountId.toString(),
      slug: option.slug.value,
    }
  }
}
