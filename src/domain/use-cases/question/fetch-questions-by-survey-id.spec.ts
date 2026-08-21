import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { Question } from '@/domain/entities/question'
import { InMemoryQuestionRepository } from 'test/repositories/in-memory-question-repository'
import { FetchQuestionsBySurveyIdUseCase } from './fetch-questions-by-survey-id'
import { unwrapRight } from 'test/utils/either'

let inMemoryQuestionRepository: InMemoryQuestionRepository
let sut: FetchQuestionsBySurveyIdUseCase

describe('Fetch Questions By Survey Id', () => {
  beforeEach(() => {
    inMemoryQuestionRepository = new InMemoryQuestionRepository()
    sut = new FetchQuestionsBySurveyIdUseCase(inMemoryQuestionRepository)
  })

  it('should be able to fetch questions by survey id', async () => {
    const question1 = Question.create({
      questionTitle: 'Question 1',
      questionNum: 1,
      surveyId: new UniqueEntityID('survey-1'),
      accountId: new UniqueEntityID('account-1'),
    })
    const question2 = Question.create({
      questionTitle: 'Question 2',
      questionNum: 2,
      surveyId: new UniqueEntityID('survey-1'),
      accountId: new UniqueEntityID('account-1'),
    })

    await inMemoryQuestionRepository.create(question1)
    await inMemoryQuestionRepository.create(question2)

    const result = await sut.execute({
      surveyId: question1.surveyId.toString(),
      accountId: 'account-1',
    })

    const { question: questions } = unwrapRight(result)
    expect(questions[0].id.toString()).toBe(question1.id.toString())
    expect(questions[0].questionTitle).toBe('Question 1')
    expect(questions[0].questionNum).toBe(1)
    expect(questions[1].id.toString()).toBe(question2.id.toString())
    expect(questions[1].questionTitle).toBe('Question 2')
    expect(questions[1].questionNum).toBe(2)
  })

  it('should not be able to fetch a question that does not exist', async () => {
    const result = await sut.execute({
      surveyId: 'non-existing-id',
      accountId: 'account-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })
})
