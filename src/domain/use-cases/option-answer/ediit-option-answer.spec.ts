import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { InMemoryOptionAnswersRepository } from 'test/repositories/in-memory-option-answer-repository'
import { EditOptionAnswerUseCase } from './edit-option-answer'
import { makeOptionAnswer } from 'test/factories/make-option-answer'

let inMemoryOptionAnswersRepository: InMemoryOptionAnswersRepository
let sut: EditOptionAnswerUseCase

describe('Edit OptionAnswer', () => {
  beforeEach(() => {
    inMemoryOptionAnswersRepository = new InMemoryOptionAnswersRepository()
    sut = new EditOptionAnswerUseCase(inMemoryOptionAnswersRepository)
  })

  it('Should be able to edit a optionanswer', async () => {
    const optionanswer = makeOptionAnswer(
      {
        questionId: new UniqueEntityID(),
        answerTitle: 'any_title',
        answerNum: 1,
      },
      new UniqueEntityID(),
    )

    await inMemoryOptionAnswersRepository.create(optionanswer)

    const editedOptionAnswer = await sut.execute({
      answerId: optionanswer.id,
      answerTitle: 'new_title',
      answerNum: 2,
    })

    expect(editedOptionAnswer.isRight()).toBe(true)
    if ('optionanswer' in editedOptionAnswer.value) {
      expect(inMemoryOptionAnswersRepository.items[0]).toEqual(
        editedOptionAnswer.value.optionanswer,
      )
    }
  })
})
