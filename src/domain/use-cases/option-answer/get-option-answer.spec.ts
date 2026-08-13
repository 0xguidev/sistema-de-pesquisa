import { InMemoryOptionAnswersRepository } from 'test/repositories/in-memory-option-answer-repository'
import { GetOptionAnswerUseCase } from './get-option-answer'
import { makeOptionAnswer } from 'test/factories/make-option-answer'
import { makeAccount } from '../../../../test/factories/make-Account'
import { makeQuestion } from '../../../../test/factories/make-question'
import { makeSurvey } from '../../../../test/factories/make-survey'

let inMemoryOptionAnswersRepository: InMemoryOptionAnswersRepository
let sut: GetOptionAnswerUseCase

describe('Get OptionAnswer', () => {
  beforeEach(() => {
    inMemoryOptionAnswersRepository = new InMemoryOptionAnswersRepository()
    sut = new GetOptionAnswerUseCase(inMemoryOptionAnswersRepository)
  })

  it('Should be able to get a optionanswer', async () => {
    const user = makeAccount()
    const survey = makeSurvey({
      accountId: user.id,
    })
    const question = makeQuestion({
      surveyId: survey.id,
    })
    const optionanswer = makeOptionAnswer({
      questionId: question.id,
      accountId: user.id,
    })

    await inMemoryOptionAnswersRepository.create(optionanswer)

    const existsOptionAnswer = await sut.execute({
      optionId: optionanswer.id.toString(),
      accountId: user.id.toString(),
    })

    expect(existsOptionAnswer.isRight()).toBe(true)
    if (!(existsOptionAnswer.value instanceof Error)) {
      expect(inMemoryOptionAnswersRepository.items[0]).toEqual(
        existsOptionAnswer.value.optionanswer,
      )
    }
  })
  it('Should not get an optionanswer from another account', async () => {
    const owner = makeAccount()
    const otherUser = makeAccount()
    const optionanswer = makeOptionAnswer({ accountId: owner.id })

    await inMemoryOptionAnswersRepository.create(optionanswer)

    const result = await sut.execute({
      optionId: optionanswer.id.toString(),
      accountId: otherUser.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
  })
})
