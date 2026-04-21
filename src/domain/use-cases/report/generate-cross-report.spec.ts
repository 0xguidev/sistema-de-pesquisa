import { expect, beforeEach, describe, it, vi } from 'vitest'
import { GenerateCrossReportUseCase } from './generate-cross-report'
import { InMemoryInterviewRepository } from 'test/repositories/in-memory-interview-repository'
import { InMemoryQuestionRepository } from 'test/repositories/in-memory-question-repository'
import { InMemoryOptionAnswersRepository } from 'test/repositories/in-memory-option-answer-repository'
import { makeQuestion } from 'test/factories/make-question'
import { makeOptionAnswer } from 'test/factories/make-option-answer'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

let interviewRepo: InMemoryInterviewRepository
let questionRepo: InMemoryQuestionRepository
let optionRepo: InMemoryOptionAnswersRepository
let sut: GenerateCrossReportUseCase

describe('Generate cross report', () => {
  beforeEach(async () => {
    interviewRepo = new InMemoryInterviewRepository()
    questionRepo = new InMemoryQuestionRepository()
    optionRepo = new InMemoryOptionAnswersRepository()

    sut = new GenerateCrossReportUseCase(
      interviewRepo,
      questionRepo,
      optionRepo,
    )
  })

  it('should generate cross report data', async () => {
    // 1. Setup survey
    const surveyId = new UniqueEntityID('survey-1')
    // survey não necessário para este teste

    // 2. 2 questions
    const question1 = makeQuestion({
      surveyId,
      questionNum: 1,
      questionTitle: 'Qual sua cor favorita?',
    })
    const question2 = makeQuestion({
      surveyId,
      questionNum: 2,
      questionTitle: 'Qual seu animal favorito?',
    })

    // 3. Options para Q1 e Q2
    const option1Q1 = makeOptionAnswer({
      questionId: question1.id,
      optionNum: 1,
      optionTitle: 'Azul',
    })
    const option2Q1 = makeOptionAnswer({
      questionId: question1.id,
      optionNum: 2,
      optionTitle: 'Vermelho',
    })
    const option1Q2 = makeOptionAnswer({
      questionId: question2.id,
      optionNum: 1,
      optionTitle: 'Cachorro',
    })

    // 4. Popular repositories
    await questionRepo.create(question1)
    await questionRepo.create(question2)
    await optionRepo.create(option1Q1)
    await optionRepo.create(option2Q1)
    await optionRepo.create(option1Q2)

    // 5. Mock interviews: Interview1=Azul/Cachorro(1,1), Interview2=Vermelho/Cachorro(2,1)
    const mockInterviews = {
      data: [
        {
          id: 'interview-1',
          surveyId: 'survey-1',
          accountId: 'account-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          answers: [
            {
              answerId: 'answer-1',
              question: {
                questionId: question1.id.toString(),
                title: question1.questionTitle,
                number: question1.questionNum,
              },
              option: {
                optionId: option1Q1.id.toString(),
                title: 'Azul',
                number: 1,
              },
            },
            {
              answerId: 'answer-2',
              question: {
                questionId: question2.id.toString(),
                title: question2.questionTitle,
                number: question2.questionNum,
              },
              option: {
                optionId: option1Q2.id.toString(),
                title: 'Cachorro',
                number: 1,
              },
            },
          ],
        },
        {
          id: 'interview-2',
          surveyId: 'survey-1',
          accountId: 'account-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          answers: [
            {
              answerId: 'answer-3',
              question: {
                questionId: question1.id.toString(),
                title: question1.questionTitle,
                number: question1.questionNum,
              },
              option: {
                optionId: option2Q1.id.toString(),
                title: 'Vermelho',
                number: 2,
              },
            },
            {
              answerId: 'answer-4',
              question: {
                questionId: question2.id.toString(),
                title: question2.questionTitle,
                number: question2.questionNum,
              },
              option: {
                optionId: option1Q2.id.toString(),
                title: 'Cachorro',
                number: 1,
              },
            },
          ],
        },
      ],
      total: 2,
    }

    interviewRepo.findBySurveyId = vi.fn().mockResolvedValue(mockInterviews)

    const result = await sut.execute('survey-1', 'account-1')

    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBe(1) // 1 par: Q1 x Q2

    const crossReport = result[0]
    expect(crossReport.questionA).toBe('Qual sua cor favorita?')
    expect(crossReport.questionB).toBe('Qual seu animal favorito?')
    expect(crossReport.answers.length).toBe(2) // 2 combinações cartesianas

    // Azul-Cachorro (1,1): 50%, Vermelho-Cachorro (2,1): 50%
    expect(crossReport.answers[0].percentage).toBe(50)
    expect(crossReport.answers[0].numA).toBe(1)
    expect(crossReport.answers[0].answerA).toBe('Azul')
    expect(crossReport.answers[0].numB).toBe(1)
    expect(crossReport.answers[0].answerB).toBe('Cachorro')

    expect(crossReport.answers[1].percentage).toBe(50)
    expect(crossReport.answers[1].numA).toBe(2)
    expect(crossReport.answers[1].answerA).toBe('Vermelho')
  })

  it('should throw error when no interviews found', async () => {
    interviewRepo.findBySurveyId = vi.fn().mockResolvedValue({
      data: [],
      total: 0,
    })

    await expect(sut.execute('survey-1', 'account-1')).rejects.toThrow(
      'Nenhuma entrevista encontrada para gerar relatório',
    )
  })

  it('should throw error when less than 2 questions', async () => {
    // Setup apenas 1 question
    const surveyId = new UniqueEntityID('survey-1')
    const question1 = makeQuestion({ surveyId, questionNum: 1 })
    await questionRepo.create(question1)

    // Mock interviews válidos
    interviewRepo.findBySurveyId = vi.fn().mockResolvedValue({
      data: [
        {
          id: '1',
          answers: [],
          surveyId: 'survey-1',
          accountId: 'account-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      total: 1,
    })

    await expect(sut.execute('survey-1', 'account-1')).rejects.toThrow(
      'São necessárias pelo menos duas perguntas para gerar relatório cruzado',
    )
  })
})
