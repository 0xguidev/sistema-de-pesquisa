import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { Question } from '@/domain/entities/question'
import { InMemoryQuestionRepository } from 'test/repositories/in-memory-question-repository'
import { FetchQuestionByIdUseCase } from './fetch-question-by-id'

let inMemoryQuestionRepository: InMemoryQuestionRepository
let sut: FetchQuestionByIdUseCase

describe('Fetch Question By Id', () => {
  beforeEach(() => {
    inMemoryQuestionRepository = new InMemoryQuestionRepository()
    sut = new FetchQuestionByIdUseCase(inMemoryQuestionRepository)
  })

  it('should be able to fetch a question by id', async () => {
    const question = Question.create({
      questionTitle: 'Question 1',
      questionNum: 1,
      surveyId: new UniqueEntityID('survey-1'),
      accountId: new UniqueEntityID('account-1'),
    })

    await inMemoryQuestionRepository.create(question)

    const result = await sut.execute({
      questionId: question.id.toString(),
      accountId: 'account-1',
    })

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.question.id.toString()).toBe(question.id.toString())
      expect(result.value.question.questionTitle).toBe('Question 1')
      expect(result.value.question.questionNum).toBe(1)
    }
  })

  it('should not be able to fetch a question that does not exist', async () => {
    const result = await sut.execute({
      questionId: 'non-existing-id',
      accountId: 'account-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should not be able to fetch a question that belongs to another account', async () => {
    const question = Question.create({
      questionTitle: 'Question 1',
      questionNum: 1,
      surveyId: new UniqueEntityID('survey-1'),
      accountId: new UniqueEntityID('account-1'),
    })

    await inMemoryQuestionRepository.create(question)

    const result = await sut.execute({
      questionId: question.id.toString(),
      accountId: 'account-2',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })
})
