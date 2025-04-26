import { expect, beforeEach } from 'vitest'
import { InMemoryQuestionRepository } from '../../../../test/repositories/in-memory-question-repository'
import { CreateQuestionUseCase } from './create-question'
import { makeAccount } from 'test/factories/make-Account'
import { makeSurvey } from 'test/factories/make-survey'

let inMemoryQuestionRepository: InMemoryQuestionRepository
let sut: CreateQuestionUseCase

describe('create an question', async () => {
  beforeEach(() => {
    inMemoryQuestionRepository = new InMemoryQuestionRepository()

    sut = new CreateQuestionUseCase(inMemoryQuestionRepository)

  })

  it('should create a question', async () => {
    const account = makeAccount()

    const survey = makeSurvey()

    const createdQuestion = await sut.execute({
      questionTitle: 'What is your favorite color?',
      questionNum: 1,
      accountId: account.id.toString(),
      surveyId: survey.id.toString(),
    })

    expect(createdQuestion.isRight()).toBe(true)
    expect(inMemoryQuestionRepository.items[0]).toEqual(
      createdQuestion.value?.question,
    )
  })
})
