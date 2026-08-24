import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { InMemoryQuestionRepository } from 'test/repositories/in-memory-question-repository'
import { InMemorySurveyRepository } from 'test/repositories/in-memory-survey-repository'
import { makeQuestion } from 'test/factories/make-question'
import { makeSurvey } from 'test/factories/make-survey'
import { unwrapRight } from 'test/utils/either'
import { FetchQuestionsBySurveyIdUseCase } from './fetch-questions-by-survey-id'

describe('Fetch Questions By Survey Id', () => {
  let questions: InMemoryQuestionRepository
  let surveys: InMemorySurveyRepository
  let sut: FetchQuestionsBySurveyIdUseCase

  beforeEach(() => {
    questions = new InMemoryQuestionRepository()
    surveys = new InMemorySurveyRepository()
    sut = new FetchQuestionsBySurveyIdUseCase(questions, surveys)
  })

  it('authorizes using the survey and returns its questions', async () => {
    const accountId = new UniqueEntityID('account-1')
    const survey = makeSurvey({ accountId })
    const question = makeQuestion({ accountId, surveyId: survey.id })
    await surveys.create(survey)
    await questions.create(question)

    const result = await sut.execute({
      surveyId: survey.id.toString(),
      accountId: accountId.toString(),
    })
    expect(unwrapRight(result).question).toEqual([question])
  })

  it('returns an empty list for an owned survey without questions', async () => {
    const survey = makeSurvey({ accountId: new UniqueEntityID('account-1') })
    await surveys.create(survey)
    const result = await sut.execute({
      surveyId: survey.id.toString(),
      accountId: 'account-1',
    })
    expect(unwrapRight(result).question).toEqual([])
  })

  it('does not distinguish a foreign survey from a missing survey', async () => {
    const survey = makeSurvey({ accountId: new UniqueEntityID('owner') })
    await surveys.create(survey)
    for (const surveyId of [survey.id.toString(), 'missing']) {
      const result = await sut.execute({ surveyId, accountId: 'other-user' })
      expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    }
  })
})
