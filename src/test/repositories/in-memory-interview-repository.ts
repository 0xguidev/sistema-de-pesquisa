import { Interview } from 'src/domain/entities/interview'
import { InterviewRepository } from 'src/domain/repositories/interview-repository'

export class InMemoryInterviewRepository implements InterviewRepository {
  public items: Interview[] = []

  constructor() // private survey: InMemorySurveyRepository,
  {}

  async findById(id: string) {
    const interview = this.items.find((item) => item.id.toString() === id)

    if (!interview) {
      return null
    }

    return interview
  }

  // async findBySlug(slug: string) {
  //   const interview = this.items.find((item) => item.slug.value === slug)

  //   if (!interview) {
  //     return null
  //   }

  //   return interview
  // }

  // async findDetailsBySlug(slug: string) {
  //   const interview = this.items.find((item) => item.slug.value === slug)

  //   if (!interview) {
  //     return null
  //   }

  //   const author = this.studentsRepository.items.find((student) => {
  //     return student.id.equals(interview.authorId)
  //   })

  //   if (!author) {
  //     throw new Error(
  //       `Author with ID "${interview.authorId.toString()}" does not exist.`,
  //     )
  //   }

  //   const interviewAttachments = this.interviewAttachmentsRepository.items.filter(
  //     (interviewAttachment) => {
  //       return interviewAttachment.interviewId.equals(interview.id)
  //     },
  //   )

  //   const attachments = interviewAttachments.map((interviewAttachment) => {
  //     const attachment = this.attachmentsRepository.items.find((attachment) => {
  //       return attachment.id.equals(interviewAttachment.attachmentId)
  //     })

  //     if (!attachment) {
  //       throw new Error(
  //         `Attachment with ID "${interviewAttachment.attachmentId.toString()}" does not exist.`,
  //       )
  //     }

  //     return attachment
  //   })

  //   return InterviewDetails.create({
  //     interviewId: interview.id,
  //     authorId: interview.authorId,
  //     author: author.name,
  //     title: interview.title,
  //     slug: interview.slug,
  //     content: interview.content,
  //     bestAnswerId: interview.bestAnswerId,
  //     attachments,
  //     createdAt: interview.createdAt,
  //     updatedAt: interview.updatedAt,
  //   })
  // }

  // async findManyRecent({ page }: PaginationParams) {
  //   const interviews = this.items
  //     .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  //     .slice((page - 1) * 20, page * 20)

  //   return interviews
  // }

  async create(interview: Interview) {
    this.items.push(interview)
  }

  async save(interview: Interview) {
    const itemIndex = this.items.findIndex((item) => item.id === interview.id)

    this.items[itemIndex] = interview
  }

  async delete(interview: Interview) {
    const itemIndex = this.items.findIndex((item) => item.id === interview.id)

    this.items.splice(itemIndex, 1)
  }
}
