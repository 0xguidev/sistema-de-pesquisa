import { expect, beforeEach, describe, it, vi } from 'vitest'
import { GenerateSimpleReportUseCase } from './generate-simple-report'
import { InMemoryInterviewRepository } from 'test/repositories/in-memory-interview-repository'
import { makeQuestion } from 'test/factories/make-question'
import { makeOptionAnswer } from 'test/factories/make-option-answer'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

let inMemoryInterviewRepository: InMemoryInterviewRepository
let sut: GenerateSimpleReportUseCase

describe('Generate simple report', () => {
  beforeEach(() => {
    inMemoryInterviewRepository = new InMemoryInterviewRepository()
    sut = new GenerateSimpleReportUseCase(inMemoryInterviewRepository)
  })

  it('should generate simple report data', async () => {
    // Setup factories para dados realistas
    const surveyId = new UniqueEntityID('survey-1')
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

    // 2 interviews: Interview1=Azul/Cachorro, Interview2=Vermelho/Cachorro (Q1:50/50, Q2:100%)
    const mockData = {
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
                title: option1Q1.optionTitle,
                number: option1Q1.optionNum,
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
                title: option1Q2.optionTitle,
                number: option1Q2.optionNum,
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
                title: option2Q1.optionTitle,
                number: option2Q1.optionNum,
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
                title: option1Q2.optionTitle,
                number: option1Q2.optionNum,
              },
            },
          ],
        },
      ],
      total: 2,
    }

    inMemoryInterviewRepository.findBySurveyId = vi
      .fn()
      .mockResolvedValue(mockData)

    const result = await sut.execute('survey-1', 'account-1')

    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBe(2)

    // Q1: Azul 50%, Vermelho 50%
    expect(result[0].questionNum).toBe(1)
    expect(result[0].questionTitle).toBe(question1.questionTitle)
    expect(result[0].options.length).toBe(2)
    expect(result[0].options[0].percentage).toBe(50)
    expect(result[0].options[0].answer).toBe('Azul')
    expect(result[0].options[1].percentage).toBe(50)
    expect(result[0].options[1].answer).toBe('Vermelho')

    // Q2: Cachorro 100%
    expect(result[1].questionNum).toBe(2)
    expect(result[1].options[0].percentage).toBe(100)
    expect(result[1].options[0].answer).toBe('Cachorro')

    expect(inMemoryInterviewRepository.findBySurveyId).toHaveBeenCalledWith(
      'survey-1',
      'account-1',
      1,
      1000,
    )
  })

  it('should throw error when no interviews found', async () => {
    inMemoryInterviewRepository.findBySurveyId = vi.fn().mockResolvedValue({
      data: [],
      total: 0,
    })

    await expect(sut.execute('survey-1', 'account-1')).rejects.toThrow(
      'Nenhuma entrevista encontrada para gerar relatório',
    )
  })
})
