import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { AnswerQuestion } from 'src/domain/entities/answer-question'
import { AnswerQuestionRepository } from 'src/domain/repositories/answer-question-repository'

export class InMemoryAnswerQuestionRepository
  implements AnswerQuestionRepository
{
  public items: AnswerQuestion[] = []

  constructor() {} // private survey: InMemorySurveyRepository,

  async findById(id: UniqueEntityID) {
    const answerquestion = this.items.find((item) => item.id === id)

    if (!answerquestion) {
      return null
    }

    return answerquestion
  }

  // async findBySlug(slug: string) {
  //   const answerquestion = this.items.find((item) => item.slug.value === slug)

  //   if (!answerquestion) {
  //     return null
  //   }

  //   return answerquestion
  // }

  // async findDetailsBySlug(slug: string) {
  //   const answerquestion = this.items.find((item) => item.slug.value === slug)

  //   if (!answerquestion) {
  //     return null
  //   }

  //   const author = this.studentsRepository.items.find((student) => {
  //     return student.id.equals(answerquestion.authorId)
  //   })

  //   if (!author) {
  //     throw new Error(
  //       `Author with ID "${answerquestion.authorId.toString()}" does not exist.`,
  //     )
  //   }

  //   const answerquestionAttachments = this.answerquestionAttachmentsRepository.items.filter(
  //     (answerquestionAttachment) => {
  //       return answerquestionAttachment.answerquestionId.equals(answerquestion.id)
  //     },
  //   )

  //   const attachments = answerquestionAttachments.map((answerquestionAttachment) => {
  //     const attachment = this.attachmentsRepository.items.find((attachment) => {
  //       return attachment.id.equals(answerquestionAttachment.attachmentId)
  //     })

  //     if (!attachment) {
  //       throw new Error(
  //         `Attachment with ID "${answerquestionAttachment.attachmentId.toString()}" does not exist.`,
  //       )
  //     }

  //     return attachment
  //   })

  //   return AnswerQuestionDetails.create({
  //     answerquestionId: answerquestion.id,
  //     authorId: answerquestion.authorId,
  //     author: author.name,
  //     title: answerquestion.title,
  //     slug: answerquestion.slug,
  //     content: answerquestion.content,
  //     bestAnswerId: answerquestion.bestAnswerId,
  //     attachments,
  //     createdAt: answerquestion.createdAt,
  //     updatedAt: answerquestion.updatedAt,
  //   })
  // }

  // async findManyRecent({ page }: PaginationParams) {
  //   const answerquestions = this.items
  //     .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  //     .slice((page - 1) * 20, page * 20)

  //   return answerquestions
  // }

  async create(answerquestion: AnswerQuestion) {
    this.items.push(answerquestion)
  }

  async save(answerquestion: AnswerQuestion) {
    const itemIndex = this.items.findIndex(
      (item) => item.id === answerquestion.id,
    )

    this.items[itemIndex] = answerquestion
  }

  async update(answerquestion: AnswerQuestion): Promise<void> {
    const result = this.findById(answerquestion.id)
    if (!result) {
      throw new Error('Question not found')
    }

    this.save(answerquestion)
  }

  async delete(id: UniqueEntityID) {
    const itemIndex = this.items.findIndex((item) => item.id === id)

    this.items.splice(itemIndex, 1)
  }
}
