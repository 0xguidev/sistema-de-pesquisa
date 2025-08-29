import { Interview } from 'src/domain/entities/interview'
import { InterviewRepository } from 'src/domain/repositories/interview-repository'

export class InMemoryInterviewRepository implements InterviewRepository {
  public items: Interview[] = []

  constructor() {} // private survey: InMemorySurveyRepository,

  async findBySurveyId(
    surveyId: string,
    accountId: string,
    page: number,
    limit: number,
  ): Promise<{
    data: {
      id: string
      surveyId: string
      accountId: string
      createdAt: Date
      updatedAt: Date
      answers: { id: string; question: string; answer: string }[]
    }[]
    total: number
  }> {
    // Filtra entrevistas pelo surveyId e accountId
    const filtered = this.items.filter(
      (item) =>
        item.surveyId.toString() === surveyId &&
        item.accountId.toString() === accountId,
    )

    const total = filtered.length

    // Aplica paginação
    const start = (page - 1) * limit
    const end = start + limit
    const paginated = filtered.slice(start, end)

    // Converte para InterviewDetails no formato esperado
    const data = paginated.map((interview) => ({
      id: interview.id.toString(),
      surveyId: interview.surveyId.toString(),
      accountId: interview.accountId.toString(),
      createdAt: interview.createdAt,
      updatedAt: interview.updatedAt ?? interview.createdAt,
      answers: [], // Placeholder até integrar respostas
    }))

    return { data, total }
  }

  async findById(id: string) {
    const interview = this.items.find((item) => item.id.toString() === id)

    if (!interview) {
      return null
    }

    return interview
  }

  async create(interview: Interview) {
    this.items.push(interview)
  }

  async save(interview: Interview) {
    const itemIndex = this.items.findIndex((item) => item.id === interview.id)

    this.items[itemIndex] = interview
  }

  async update(interview: Interview): Promise<void> {
    const result = this.findById(interview.id.toString())
    if (!result) {
      throw new Error('Question not found')
    }

    this.save(interview)
  }

  async delete(id: string) {
    const itemIndex = this.items.findIndex((item) => item.id.toString() === id)

    this.items.splice(itemIndex, 1)
  }
}
