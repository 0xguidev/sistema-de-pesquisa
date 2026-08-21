import { makeSurvey } from 'test/factories/make-survey'
import { EditSurveyUseCase } from './edit-survey'
import { InMemorySurveyRepository } from 'test/repositories/in-memory-survey-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'

let inMemorySurveysRepository: InMemorySurveyRepository
let sut: EditSurveyUseCase

describe('Edit Survey', () => {
  beforeEach(() => {
    inMemorySurveysRepository = new InMemorySurveyRepository()
    sut = new EditSurveyUseCase(inMemorySurveysRepository)
  })

  it('Should be able to edit a survey', async () => {
    const survey = makeSurvey({ title: 'any_title' }, new UniqueEntityID())

    await inMemorySurveysRepository.create(survey)
    const update = vi.spyOn(inMemorySurveysRepository, 'update')

    const editedSurvey = await sut.execute({
      surveyId: survey.id.toString(),
      accountId: survey.accountId.toString(),
      surveyTitle: 'new_title',
      surveyLocation: 'new location',
    })

    expect(editedSurvey.isRight()).toBe(true)
    expect(update).toHaveBeenCalledOnce()
    expect(inMemorySurveysRepository.items[0].title).toBe('new_title')
    expect(inMemorySurveysRepository.items[0].location).toBe('new location')
  })

  it('returns not found for a missing survey', async () => {
    const result = await sut.execute({
      surveyId: 'missing',
      accountId: 'account-1',
      surveyTitle: 'new_title',
    })
    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('does not edit another account survey', async () => {
    const survey = makeSurvey({ title: 'original' })
    await inMemorySurveysRepository.create(survey)
    const result = await sut.execute({
      surveyId: survey.id.toString(),
      accountId: 'another-account',
      surveyTitle: 'forbidden',
    })
    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(survey.title).toBe('original')
  })
})
