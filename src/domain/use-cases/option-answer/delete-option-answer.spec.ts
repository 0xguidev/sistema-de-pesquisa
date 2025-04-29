import { InMemoryOptionAnswersRepository } from 'test/repositories/in-memory-option-answer-repository'
import { DeleteOptionAnswerUseCase } from './delete-option-answer'
import { makeOptionAnswer } from 'test/factories/make-option-answer'

let inMemoryOptionAnswersRepository: InMemoryOptionAnswersRepository
let sut: DeleteOptionAnswerUseCase

describe('Delete an optionanswer', () => {
  beforeAll(() => {
    inMemoryOptionAnswersRepository = new InMemoryOptionAnswersRepository()

    sut = new DeleteOptionAnswerUseCase(inMemoryOptionAnswersRepository)
  })

  it('should delete an optionanswer', async () => {
    const optionAnswer = makeOptionAnswer()

    await inMemoryOptionAnswersRepository.create(optionAnswer)

    await sut.execute({
      optionAnswerId: optionAnswer.id.toString(),
    })

    expect(inMemoryOptionAnswersRepository.items).toHaveLength(0)
  })
})
