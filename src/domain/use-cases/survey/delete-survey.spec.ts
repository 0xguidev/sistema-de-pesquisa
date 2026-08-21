import { InMemorySurveyRepository } from 'test/repositories/in-memory-survey-repository'
import { DeleteSurveyUseCase } from './delete-survey'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { makeSurvey } from 'test/factories/make-survey'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'

let inMemorySurveyRepository: InMemorySurveyRepository
let sut: DeleteSurveyUseCase

describe('Delete survey', () => {
  beforeEach(() => {
    inMemorySurveyRepository = new InMemorySurveyRepository()

    sut = new DeleteSurveyUseCase(inMemorySurveyRepository)
  })

  it('should delete a survey', async () => {
    const survey = makeSurvey(
      { title: 'any_title' },
      new UniqueEntityID('survey_id'),
    )

    await inMemorySurveyRepository.create(survey)

    const result = await sut.execute({
      surveyId: survey.id.toString(),
      accountId: survey.accountId.toString(),
    })

    expect(inMemorySurveyRepository.items).toHaveLength(0)
    expect(result.isRight()).toBe(true)
  })

  it('returns not found for a missing survey', async () => {
    const result = await sut.execute({
      surveyId: 'missing',
      accountId: 'owner',
    })
    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('does not delete another account survey', async () => {
    const survey = makeSurvey()
    await inMemorySurveyRepository.create(survey)
    const result = await sut.execute({
      surveyId: survey.id.toString(),
      accountId: 'attacker',
    })
    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(inMemorySurveyRepository.items).toHaveLength(1)
  })
})
