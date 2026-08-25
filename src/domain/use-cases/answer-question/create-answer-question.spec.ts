import { expect, beforeEach } from 'vitest'
import { CreateAnswerQuestionUseCase } from './create-answer-question'
import { InMemoryAnswerQuestionRepository } from 'test/repositories/in-memory-answer-question-repository'
import { makeOptionAnswer } from 'test/factories/make-option-answer'
import { makeQuestion } from 'test/factories/make-question'
import { makeInterview } from 'test/factories/make-interview'
import { makeAccount } from 'test/factories/make-Account'
import { InMemoryInterviewRepository } from 'test/repositories/in-memory-interview-repository'
import { InMemoryQuestionRepository } from 'test/repositories/in-memory-question-repository'
import { InMemoryOptionAnswersRepository } from 'test/repositories/in-memory-option-answer-repository'
import { makeSurvey } from 'test/factories/make-survey'
import { unwrapRight } from 'test/utils/either'

let inMemoryAnswerQuestionsRepository: InMemoryAnswerQuestionRepository
let inMemoryInterviewRepository: InMemoryInterviewRepository
let inMemoryQuestionRepository: InMemoryQuestionRepository
let inMemoryOptionAnswersRepository: InMemoryOptionAnswersRepository
let sut: CreateAnswerQuestionUseCase

describe('Create answer question', () => {
  beforeEach(() => {
    inMemoryAnswerQuestionsRepository = new InMemoryAnswerQuestionRepository()
    inMemoryInterviewRepository = new InMemoryInterviewRepository()
    inMemoryQuestionRepository = new InMemoryQuestionRepository()
    inMemoryOptionAnswersRepository = new InMemoryOptionAnswersRepository()
    sut = new CreateAnswerQuestionUseCase(
      inMemoryAnswerQuestionsRepository,
      inMemoryInterviewRepository,
      inMemoryQuestionRepository,
      inMemoryOptionAnswersRepository,
    )
  })

  it('should create an answer', async () => {
    const account = makeAccount()
    const survey = makeSurvey({ accountId: account.id })
    const question = makeQuestion({
      surveyId: survey.id,
      accountId: account.id,
    })
    const interview = makeInterview({
      surveyId: survey.id,
      accountId: account.id,
    })
    const option = makeOptionAnswer({
      questionId: question.id,
      accountId: account.id,
    })
    await inMemoryQuestionRepository.create(question)
    await inMemoryInterviewRepository.create(interview)
    await inMemoryOptionAnswersRepository.create(option)

    const createdAnswerQuestion = await sut.execute({
      interviewId: interview.id.toString(),
      questionId: question.id.toString(),
      optionAnswerId: option.id.toString(),
      accountId: account.id.toString(),
    })

    const { answerQuestion } = unwrapRight(createdAnswerQuestion)
    expect(inMemoryAnswerQuestionsRepository.items[0]).toEqual(answerQuestion)
  })

  it('should reject cross-tenant and incompatible answer resources', async () => {
    const owner = makeAccount()
    const attacker = makeAccount()
    const ownerSurvey = makeSurvey({ accountId: owner.id })
    const otherSurvey = makeSurvey({ accountId: owner.id })
    const question = makeQuestion({
      surveyId: ownerSurvey.id,
      accountId: owner.id,
    })
    const otherQuestion = makeQuestion({
      surveyId: otherSurvey.id,
      accountId: owner.id,
    })
    const interview = makeInterview({
      surveyId: ownerSurvey.id,
      accountId: owner.id,
    })
    const option = makeOptionAnswer({
      questionId: question.id,
      accountId: owner.id,
    })
    await inMemoryQuestionRepository.create(question)
    await inMemoryQuestionRepository.create(otherQuestion)
    await inMemoryInterviewRepository.create(interview)
    await inMemoryOptionAnswersRepository.create(option)

    const crossTenant = await sut.execute({
      interviewId: interview.id.toString(),
      questionId: question.id.toString(),
      optionAnswerId: option.id.toString(),
      accountId: attacker.id.toString(),
    })
    const mismatchedSurvey = await sut.execute({
      interviewId: interview.id.toString(),
      questionId: otherQuestion.id.toString(),
      optionAnswerId: option.id.toString(),
      accountId: owner.id.toString(),
    })

    expect(crossTenant.isLeft()).toBe(true)
    expect(mismatchedSurvey.isLeft()).toBe(true)
    expect(inMemoryAnswerQuestionsRepository.items).toHaveLength(0)
  })
})
