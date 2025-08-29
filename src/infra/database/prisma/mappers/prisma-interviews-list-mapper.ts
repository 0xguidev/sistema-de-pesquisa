import { UniqueEntityID } from '@/core/entities/unique-entity-id'

export class PrismaInterviewListMapper {
  static toDomain(raw: {
    id: string
    surveyId: string
    userId: string
    createdAt: Date
    updatedAt: Date | null
    answer_questions: {
      id: string
      question: {
        id: string
        title: string
        number: number
      }
      optionAnswer: {
        id: string
        option: string
        number: number
      }
    }[]
  }): any {
    return {
      id: new UniqueEntityID(raw.id).toValue(),
      surveyId: new UniqueEntityID(raw.surveyId).toValue(),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      answers: raw.answer_questions.map((answer) => {
        return {
          answerId: new UniqueEntityID(answer.id).toValue(),
          question: {
            questionId: new UniqueEntityID(answer.question.id).toValue(),
            title: answer.question.title,
            number: answer.question.number,
          },
          option: {
            optionId: new UniqueEntityID(answer.optionAnswer.id).toValue(),
            title: answer.optionAnswer.option,
            number: answer.optionAnswer.number,
          },
        }
      }),
    }
  }
}
