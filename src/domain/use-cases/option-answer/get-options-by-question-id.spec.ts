import { InMemoryOptionAnswersRepository } from 'test/repositories/in-memory-option-answer-repository'
import { makeOptionAnswer } from 'test/factories/make-option-answer'
import { GetOptionsByQuestionIdUseCase } from './get-options-by-question-id'
import { makeSurvey } from '../../../../test/factories/make-survey'
import { makeAccount } from '../../../../test/factories/make-Account'
import { makeQuestion } from '../../../../test/factories/make-question'

let inMemoryOptionAnswersRepository: InMemoryOptionAnswersRepository
let sut: GetOptionsByQuestionIdUseCase

describe('Get Option by question id', () => {
  beforeEach(() => {
    inMemoryOptionAnswersRepository = new InMemoryOptionAnswersRepository()
    sut = new GetOptionsByQuestionIdUseCase(inMemoryOptionAnswersRepository)
  })

  it('Should be able to get options by question id', async () => {
    const account = makeAccount()

    const survey = makeSurvey({
      accountId: account.id,
    })

    const question = makeQuestion({
      surveyId: survey.id,
      accountId: account.id,
    })
    const optionanswer1 = makeOptionAnswer({
      questionId: question.id,
      accountId: account.id,
    })
    const optionanswer2 = makeOptionAnswer({
      questionId: question.id,
      accountId: account.id,
    })

    await inMemoryOptionAnswersRepository.create(optionanswer1)
    await inMemoryOptionAnswersRepository.create(optionanswer2)

    const result = await sut.execute({
      questionId: question.id.toString(),
      userId: account.id.toString(),
    })

    expect(result.isRight()).toBe(true)

    expect(result.value).toHaveLength(2)

    expect(result.value).toEqual(
      expect.arrayContaining([
        {
          id: optionanswer1.id.toString(),
          questionId: optionanswer1.questionId.toString(),
          optionTitle: optionanswer1.optionTitle,
          optionNum: optionanswer1.optionNum,
        },
        {
          id: optionanswer2.id.toString(),
          questionId: optionanswer2.questionId.toString(),
          optionTitle: optionanswer2.optionTitle,
          optionNum: optionanswer2.optionNum,
        },
      ]),
    )
  })

  it('Should not return options from another user', async () => {
    const account = makeAccount()
    const anotherAccount = makeAccount()
    const question = makeQuestion({ accountId: account.id })

    const ownOption = makeOptionAnswer({
      questionId: question.id,
      accountId: account.id,
    })
    const otherOption = makeOptionAnswer({
      questionId: question.id,
      accountId: anotherAccount.id,
    })

    await inMemoryOptionAnswersRepository.create(ownOption)
    await inMemoryOptionAnswersRepository.create(otherOption)

    const result = await sut.execute({
      questionId: question.id.toString(),
      userId: account.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toHaveLength(1)
    expect(result.value).toEqual([
      expect.objectContaining({ id: ownOption.id.toString() }),
    ])
  })
})
