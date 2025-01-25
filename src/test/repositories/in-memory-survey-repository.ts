import { Survey } from 'src/domain/entities/survey'
import { SurveyRepository } from 'src/domain/repositories/survey-repository'

export class InMemorSurveyRepository implements SurveyRepository {
  public items: Survey[] = []

  constructor() {}

  async findById(id: string) {
    const survey = this.items.find((item) => item.id.toString() === id)

    if (!survey) {
      return null
    }

    return survey
  }

  // async findBySlug(slug: string) {
  //   const survey = this.items.find((item) => item.slug.value === slug)

  //   if (!survey) {
  //     return null
  //   }

  //   return survey
  // }

  // async findDetailsBySlug(slug: string) {
  //   const survey = this.items.find((item) => item.slug.value === slug)

  //   if (!survey) {
  //     return null
  //   }

  //   const author = this.studentsRepository.items.find((student) => {
  //     return student.id.equals(survey.authorId)
  //   })

  //   if (!author) {
  //     throw new Error(
  //       `Author with ID "${survey.authorId.toString()}" does not exist.`,
  //     )
  //   }

  //   const surveyAttachments = this.surveyAttachmentsRepository.items.filter(
  //     (surveyAttachment) => {
  //       return surveyAttachment.surveyId.equals(survey.id)
  //     },
  //   )

  //   const attachments = surveyAttachments.map((surveyAttachment) => {
  //     const attachment = this.attachmentsRepository.items.find((attachment) => {
  //       return attachment.id.equals(surveyAttachment.attachmentId)
  //     })

  //     if (!attachment) {
  //       throw new Error(
  //         `Attachment with ID "${surveyAttachment.attachmentId.toString()}" does not exist.`,
  //       )
  //     }

  //     return attachment
  //   })

  //   return SurveyDetails.create({
  //     surveyId: survey.id,
  //     authorId: survey.authorId,
  //     author: author.name,
  //     title: survey.title,
  //     slug: survey.slug,
  //     content: survey.content,
  //     bestAnswerId: survey.bestAnswerId,
  //     attachments,
  //     createdAt: survey.createdAt,
  //     updatedAt: survey.updatedAt,
  //   })
  // }

  // async findManyRecent({ page }: PaginationParams) {
  //   const surveys = this.items
  //     .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  //     .slice((page - 1) * 20, page * 20)

  //   return surveys
  // }

  async create(survey: Survey) {
    this.items.push(survey)
  }

  async save(survey: Survey) {
    const itemIndex = this.items.findIndex((item) => item.id === survey.id)

    this.items[itemIndex] = survey
  }

  async delete(survey: Survey) {
    const itemIndex = this.items.findIndex((item) => item.id === survey.id)

    this.items.splice(itemIndex, 1)
  }
}
