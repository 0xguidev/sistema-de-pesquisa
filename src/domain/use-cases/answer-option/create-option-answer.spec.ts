import { expect, beforeEach } from 'vitest'
import { InMemoryQuestionRepository } from '../../../test/repositories/in-memory-questions-repository'
import { InMemorySurveyRepository } from '../../../test/repositories/in-memory-survey-repository'
import { InMemoryOptionAnswersRepository } from 'src/test/repositories/in-memory-option-answer-repository'
import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { CreateQuestionUseCase } from '../question/create-question'
import { CreateOptionAnswerUseCase } from './create-option-answer'
import { CreateSurveyUseCase } from '../survey/create-survey'

let inMemoryQuestionRepository: InMemoryQuestionRepository
let inMemorySurveyRepository: InMemorySurveyRepository
let inMemoryOptionAnswersRepository: InMemoryOptionAnswersRepository

describe('create an option answer', async () => {
  beforeEach(() => {
    inMemoryQuestionRepository = new InMemoryQuestionRepository()
    inMemorySurveyRepository = new InMemorySurveyRepository()
    inMemoryOptionAnswersRepository = new InMemoryOptionAnswersRepository()
  })

  it('should create a option answer', async () => {
    const createSurvey = new CreateSurveyUseCase(inMemorySurveyRepository)
    const surveyTitle = 'any_title'

    const createdSurvey = await createSurvey.execute({ title: surveyTitle })

    const createQuestion = new CreateQuestionUseCase(inMemoryQuestionRepository)
    const questionTitle = 'any_title'
    const questionNum = 1
    const surveyId = createdSurvey.value?.survey.id as UniqueEntityID

    const createdQuestion = await createQuestion.execute({
      questionTitle,
      questionNum,
      surveyId,
    })

    const createOptionAnswer = new CreateOptionAnswerUseCase(
      inMemoryOptionAnswersRepository,
    )
    const answerTitle = 'any_title'
    const answerNum = 1
    const questionId = createdQuestion.value?.question.id as UniqueEntityID

    const createdOptionAnswer = await createOptionAnswer.execute({
      answerTitle,
      answerNum,
      questionId,
    })

    expect(createdOptionAnswer.isRight()).toBe(true)
    expect(inMemoryOptionAnswersRepository.items[0]).toEqual(
      createdOptionAnswer.value?.optionAnswer,
    )
  })
})
