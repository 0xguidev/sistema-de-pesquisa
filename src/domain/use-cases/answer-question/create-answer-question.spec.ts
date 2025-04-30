import { expect, beforeEach } from 'vitest'
import { CreateAnswerQuestionUseCase } from './create-answer-question'
import { InMemoryAnswerQuestionRepository } from 'test/repositories/in-memory-answer-question-repository'
import { makeOptionAnswer } from 'test/factories/make-option-answer'
import { makeQuestion } from 'test/factories/make-question'
import { makeInterview } from 'test/factories/make-interview'
import { makeAccount } from 'test/factories/make-Account'

let inMemoryAnswerQuestionsRepository: InMemoryAnswerQuestionRepository
let sut: CreateAnswerQuestionUseCase

describe('create an answer question', async () => {
  beforeEach(() => {
    inMemoryAnswerQuestionsRepository = new InMemoryAnswerQuestionRepository()
    sut = new CreateAnswerQuestionUseCase(inMemoryAnswerQuestionsRepository)
  })

  it('should create a option answer', async () => {
    const question = makeQuestion()
    const interview = makeInterview()
    const option = makeOptionAnswer()
    const account = makeAccount()

    const createdAnswerQuestion = await sut.execute({
      interviewId: interview.id,
      questionId: question.id,
      optionAnswerId: option.id,
      accountId: account.id,
    })

    expect(createdAnswerQuestion.isRight()).toBe(true)
    expect(inMemoryAnswerQuestionsRepository.items[0]).toEqual(
      createdAnswerQuestion.value?.answerQuestion,
    )
  })
})
