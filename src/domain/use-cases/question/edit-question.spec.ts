import { makeQuestion } from 'test/factories/make-question'
import { EditQuestionUseCase } from './edit-question'
import { InMemoryQuestionRepository } from 'test/repositories/in-memory-question-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'

let inMemoryQuestionsRepository: InMemoryQuestionRepository
let sut: EditQuestionUseCase

describe('Edit Question', () => {
  beforeEach(() => {
    inMemoryQuestionsRepository = new InMemoryQuestionRepository()
    sut = new EditQuestionUseCase(inMemoryQuestionsRepository)
  })

  it('Should be able to edit a question', async () => {
    const question = makeQuestion(
      { questionTitle: 'any_title', questionNum: 1 },
      new UniqueEntityID(),
    )

    await inMemoryQuestionsRepository.create(question)
    const update = vi.spyOn(inMemoryQuestionsRepository, 'update')

    const editedQuestion = await sut.execute({
      questionId: question.id.toString(),
      accountId: question.accountId.toString(),
      questionTitle: 'new_title',
      questionNum: 2,
    })

    expect(editedQuestion.isRight()).toBe(true)
    expect(update).toHaveBeenCalledOnce()
    expect(inMemoryQuestionsRepository.items[0].questionTitle).toBe('new_title')
    expect(inMemoryQuestionsRepository.items[0].questionNum).toBe(2)
  })

  it('returns not found for a missing question', async () => {
    const result = await sut.execute({
      questionId: 'missing',
      accountId: 'account-1',
      questionTitle: 'new_title',
    })
    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('does not edit another account question', async () => {
    const question = makeQuestion({ questionTitle: 'original' })
    await inMemoryQuestionsRepository.create(question)

    const result = await sut.execute({
      questionId: question.id.toString(),
      accountId: 'another-account',
      questionTitle: 'forbidden',
    })
    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(question.questionTitle).toBe('original')
  })
})
