import { expect, beforeEach } from 'vitest'
import { CreateQuestion } from './create-question'
import { CreateSurvey } from './create-survey'
import { InMemoryQuestionsRepository } from '../../test/repositories/in-memory-questions-repository'
import { InMemorSurveyRepository } from '../../test/repositories/in-memory-survey-repository'
import { InMemoryOptionAnswersRepository } from 'src/test/repositories/in-memory-option-answer-repository'
import { CreateOptionAnswer } from './create-option-answer'
import { UniqueEntityID } from 'src/core/entities/unique-entity-id'

let inMemoryQuestionsRepository: InMemoryQuestionsRepository
let inMemorySurveyRepository: InMemorSurveyRepository
let inMemoryOptionAnswersRepository: InMemoryOptionAnswersRepository

describe('create an option answer', async () => {
  beforeEach(() => {
    inMemoryQuestionsRepository = new InMemoryQuestionsRepository()
    inMemorySurveyRepository = new InMemorSurveyRepository()
    inMemoryOptionAnswersRepository = new InMemoryOptionAnswersRepository()
  })

  it('should create a option answer', async () => {
    const createSurvey = new CreateSurvey(inMemorySurveyRepository)
    const surveyTitle = 'any_title'

    const createdSurvey = await createSurvey.execute({ title: surveyTitle })

    const createQuestion = new CreateQuestion(inMemoryQuestionsRepository)
    const questionTitle = 'any_title'
    const questionNum = 1
    const surveyId = createdSurvey.value?.survey.id as UniqueEntityID

    const createdQuestion = await createQuestion.execute({
      questionTitle,
      questionNum,
      surveyId,
    })

    const createOptionAnswer = new CreateOptionAnswer(
      inMemoryOptionAnswersRepository,
    )
    const answerTitle = 'any_title'
    const answerNum = '1'
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
