import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { OptionAnswer } from 'src/domain/entities/option-answer'
import { OptionAnswerRepository } from 'src/domain/repositories/option-answer-repository'

export class InMemoryOptionAnswersRepository implements OptionAnswerRepository {
  public items: OptionAnswer[] = []

  constructor() {} // private survey: InMemorySurveyRepository,

  async findById(id: UniqueEntityID) {
    const optionanswer = this.items.find((item) => item.id === id)

    if (!optionanswer) {
      return null
    }

    return optionanswer
  }

  // async findBySlug(slug: string) {
  //   const optionanswer = this.items.find((item) => item.slug.value === slug)

  //   if (!optionanswer) {
  //     return null
  //   }

  //   return optionanswer
  // }

  // async findDetailsBySlug(slug: string) {
  //   const optionanswer = this.items.find((item) => item.slug.value === slug)

  //   if (!optionanswer) {
  //     return null
  //   }

  //   const author = this.studentsRepository.items.find((student) => {
  //     return student.id.equals(optionanswer.authorId)
  //   })

  //   if (!author) {
  //     throw new Error(
  //       `Author with ID "${optionanswer.authorId.toString()}" does not exist.`,
  //     )
  //   }

  //   const optionanswerAttachments = this.optionanswerAttachmentsRepository.items.filter(
  //     (optionanswerAttachment) => {
  //       return optionanswerAttachment.optionanswerId.equals(optionanswer.id)
  //     },
  //   )

  //   const attachments = optionanswerAttachments.map((optionanswerAttachment) => {
  //     const attachment = this.attachmentsRepository.items.find((attachment) => {
  //       return attachment.id.equals(optionanswerAttachment.attachmentId)
  //     })

  //     if (!attachment) {
  //       throw new Error(
  //         `Attachment with ID "${optionanswerAttachment.attachmentId.toString()}" does not exist.`,
  //       )
  //     }

  //     return attachment
  //   })

  //   return OptionAnswerDetails.create({
  //     optionanswerId: optionanswer.id,
  //     authorId: optionanswer.authorId,
  //     author: author.name,
  //     title: optionanswer.title,
  //     slug: optionanswer.slug,
  //     content: optionanswer.content,
  //     bestAnswerId: optionanswer.bestAnswerId,
  //     attachments,
  //     createdAt: optionanswer.createdAt,
  //     updatedAt: optionanswer.updatedAt,
  //   })
  // }

  // async findManyRecent({ page }: PaginationParams) {
  //   const optionanswers = this.items
  //     .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  //     .slice((page - 1) * 20, page * 20)

  //   return optionanswers
  // }

  async create(optionanswer: OptionAnswer) {
    this.items.push(optionanswer)
  }

  async save(optionanswer: OptionAnswer) {
    const itemIndex = this.items.findIndex(
      (item) => item.id === optionanswer.id,
    )

    this.items[itemIndex] = optionanswer
  }

  async update(optionanswer: OptionAnswer): Promise<void> {
    const result = this.findById(optionanswer.id)
    if (!result) {
      throw new Error('Question not found')
    }

    this.save(optionanswer)
  }

  async delete(id: UniqueEntityID) {
    const itemIndex = this.items.findIndex((item) => item.id === id)

    this.items.splice(itemIndex, 1)
  }
}
