import { Question } from "src/domain/entities/question"
import { QuestionRepository } from "src/domain/repositories/question-repository"

export class InMemoryQuestionsRepository implements QuestionRepository {
  public items: Question[] = []

  constructor(
    // private survey: InMemorySurveyRepository,
  ) {}

  async findById(id: string) {
    const question = this.items.find((item) => item.id.toString() === id)

    if (!question) {
      return null
    }

    return question
  }

  // async findBySlug(slug: string) {
  //   const question = this.items.find((item) => item.slug.value === slug)

  //   if (!question) {
  //     return null
  //   }

  //   return question
  // }

  // async findDetailsBySlug(slug: string) {
  //   const question = this.items.find((item) => item.slug.value === slug)

  //   if (!question) {
  //     return null
  //   }

  //   const author = this.studentsRepository.items.find((student) => {
  //     return student.id.equals(question.authorId)
  //   })

  //   if (!author) {
  //     throw new Error(
  //       `Author with ID "${question.authorId.toString()}" does not exist.`,
  //     )
  //   }

  //   const questionAttachments = this.questionAttachmentsRepository.items.filter(
  //     (questionAttachment) => {
  //       return questionAttachment.questionId.equals(question.id)
  //     },
  //   )

  //   const attachments = questionAttachments.map((questionAttachment) => {
  //     const attachment = this.attachmentsRepository.items.find((attachment) => {
  //       return attachment.id.equals(questionAttachment.attachmentId)
  //     })

  //     if (!attachment) {
  //       throw new Error(
  //         `Attachment with ID "${questionAttachment.attachmentId.toString()}" does not exist.`,
  //       )
  //     }

  //     return attachment
  //   })

  //   return QuestionDetails.create({
  //     questionId: question.id,
  //     authorId: question.authorId,
  //     author: author.name,
  //     title: question.title,
  //     slug: question.slug,
  //     content: question.content,
  //     bestAnswerId: question.bestAnswerId,
  //     attachments,
  //     createdAt: question.createdAt,
  //     updatedAt: question.updatedAt,
  //   })
  // }

  // async findManyRecent({ page }: PaginationParams) {
  //   const questions = this.items
  //     .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  //     .slice((page - 1) * 20, page * 20)

  //   return questions
  // }

  async create(question: Question) {
    this.items.push(question)
  }

  async save(question: Question) {
    const itemIndex = this.items.findIndex((item) => item.id === question.id)

    this.items[itemIndex] = question
  }

  async delete(question: Question) {
    const itemIndex = this.items.findIndex((item) => item.id === question.id)

    this.items.splice(itemIndex, 1)
  }
}
