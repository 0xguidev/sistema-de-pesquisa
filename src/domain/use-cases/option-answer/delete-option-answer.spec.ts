import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { InMemoryOptionAnswersRepository } from 'src/test/repositories/in-memory-option-answer-repository'
import { DeleteOptionAnswerUseCase } from './delete-option-answer'
import { makeOptionAnswer } from 'src/test/factories/make-option-answer'

let inMemoryOptionAnswersRepository: InMemoryOptionAnswersRepository
let sut: DeleteOptionAnswerUseCase

describe('Delete an optionanswer', () => {
  beforeAll(() => {
    inMemoryOptionAnswersRepository = new InMemoryOptionAnswersRepository()

    sut = new DeleteOptionAnswerUseCase(inMemoryOptionAnswersRepository)
  })

  it('should delete an optionanswer', async () => {
    const optionAnswer = makeOptionAnswer(
      {
        questionId: new UniqueEntityID(),
        answerTitle: 'any_title',
        answerNum: 1,
      },
      new UniqueEntityID(),
    )

    await inMemoryOptionAnswersRepository.create(optionAnswer)

    await sut.execute({
      optionAnswerId: optionAnswer.id,
    })

    expect(inMemoryOptionAnswersRepository.items).toHaveLength(0)
  })
})
