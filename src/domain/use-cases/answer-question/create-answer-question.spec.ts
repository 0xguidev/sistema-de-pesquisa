import { expect, beforeEach } from 'vitest'
import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { InMemorySurveyRepository } from '../../../test/repositories/in-memory-survey-repository'
import { InMemoryInterviewRepository } from 'src/test/repositories/in-memory-interview-repository'
import { InMemoryOptionAnswersRepository } from 'src/test/repositories/in-memory-option-answer-repository'
import { InMemoryAnswerQuestionsRepository } from 'src/test/repositories/in-memory-answer-question-repository'
import { InMemoryQuestionRepository } from 'src/test/repositories/in-memory-questions-repository'
import { CreateQuestionUseCase } from '../question/create-question'
import { CreateInterviewUseCase } from '../interview/create-interview'
import { CreateOptionAnswerUseCase } from '../answer-option/create-option-answer'
import { CreateAnswerQuestionUseCase } from './create-answer-question'
import { CreateSurveyUseCase } from '../survey/create-survey'

let inMemorySurveyRepository: InMemorySurveyRepository
let inMemoryInterviewRepository: InMemoryInterviewRepository
let inMemoryOptionAnswersRepository: InMemoryOptionAnswersRepository
let inMemoryQuestionRepository: InMemoryQuestionRepository
let inMemoryAnswerQuestionsRepository: InMemoryAnswerQuestionsRepository

describe('create an answer question', async () => {
  beforeEach(() => {
    inMemorySurveyRepository = new InMemorySurveyRepository()
    inMemoryInterviewRepository = new InMemoryInterviewRepository()
    inMemoryOptionAnswersRepository = new InMemoryOptionAnswersRepository()
    inMemoryQuestionRepository = new InMemoryQuestionRepository()
    inMemoryAnswerQuestionsRepository = new InMemoryAnswerQuestionsRepository()
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

    const createInterview = new CreateInterviewUseCase(
      inMemoryInterviewRepository,
    )
    const createdInterview = await createInterview.execute({
      surveyId,
    })

    const interviewId = createdInterview.value?.interview.id as UniqueEntityID

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

    const optionAnswerId = createdOptionAnswer.value?.optionAnswer
      .id as UniqueEntityID

    const createAnswerQuestion = new CreateAnswerQuestionUseCase(
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
