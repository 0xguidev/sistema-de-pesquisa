import { expect, beforeEach } from 'vitest'
import { CreateSurvey } from './create-survey'
import { InMemorSurveyRepository } from '../../test/repositories/in-memory-survey-repository'
import { CreateInterview } from './create-interview'
import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { InMemoryInterviewRepository } from 'src/test/repositories/in-memory-interview-repository'
import { CreateOptionAnswer } from './create-option-answer'
import { CreateQuestion } from './create-question'
import { CreateAnswerQuestion } from './create-answer-question'
import { InMemoryOptionAnswersRepository } from 'src/test/repositories/in-memory-option-answer-repository'
import { InMemoryQuestionsRepository } from 'src/test/repositories/in-memory-questions-repository'
import { InMemoryAnswerQuestionsRepository } from 'src/test/repositories/in-memory-answer-question-repository'

let inMemorySurveyRepository: InMemorSurveyRepository
let inMemoryInterviewRepository: InMemoryInterviewRepository
let inMemoryOptionAnswersRepository: InMemoryOptionAnswersRepository
let inMemoryQuestionsRepository: InMemoryQuestionsRepository
let inMemoryAnswerQuestionsRepository: InMemoryAnswerQuestionsRepository

describe('create an answer question', async () => {
  beforeEach(() => {
    inMemorySurveyRepository = new InMemorSurveyRepository()
    inMemoryInterviewRepository = new InMemoryInterviewRepository()
    inMemoryOptionAnswersRepository = new InMemoryOptionAnswersRepository()
    inMemoryQuestionsRepository = new InMemoryQuestionsRepository()
    inMemoryAnswerQuestionsRepository = new InMemoryAnswerQuestionsRepository()
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

    const createInterview = new CreateInterview(inMemoryInterviewRepository)
    const createdInterview = await createInterview.execute({
      surveyId,
    })

    const interviewId = createdInterview.value?.interview.id as UniqueEntityID

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

    const optionAnswerId = createdOptionAnswer.value?.optionAnswer
      .id as UniqueEntityID

    const createAnswerQuestion = new CreateAnswerQuestion(
      inMemoryAnswerQuestionsRepository,
    )

    const createdAnswerQuestion = await createAnswerQuestion.execute({
      interviewId,
      questionId,
      optionAnswerId: optionAnswerId,
    })

    expect(createdAnswerQuestion.isRight()).toBe(true)
    expect(inMemoryAnswerQuestionsRepository.items[0]).toEqual(
      createdAnswerQuestion.value?.answerQuestion,
    )
  })
})
