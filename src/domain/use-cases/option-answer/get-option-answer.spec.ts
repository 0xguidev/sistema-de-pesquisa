import { InMemoryOptionAnswersRepository } from 'test/repositories/in-memory-option-answer-repository'
import { GetOptionAnswerUseCase } from './get-option-answer'
import { makeOptionAnswer } from 'test/factories/make-option-answer'

let inMemoryOptionAnswersRepository: InMemoryOptionAnswersRepository
let sut: GetOptionAnswerUseCase

describe('Get OptionAnswer', () => {
  beforeEach(() => {
    inMemoryOptionAnswersRepository = new InMemoryOptionAnswersRepository()
    sut = new GetOptionAnswerUseCase(inMemoryOptionAnswersRepository)
  })

  it('Should be able to get a optionanswer', async () => {
    const optionanswer = makeOptionAnswer()

    await inMemoryOptionAnswersRepository.create(optionanswer)

    const existsOptionAnswer = await sut.execute({
      optionanswerId: optionanswer.id.toString(),
    })

    expect(existsOptionAnswer.isRight()).toBe(true)
    if (!(existsOptionAnswer.value instanceof Error)) {
      expect(inMemoryOptionAnswersRepository.items[0]).toEqual(
        existsOptionAnswer.value.optionanswer,
      )
    }
  })
})
