import { expect, beforeEach, describe, it, vi } from 'vitest'
import { GenerateSimpleReportPdfUseCase } from './generate-simple-report-pdf'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { InMemoryInterviewRepository } from '../../../../test/repositories/in-memory-interview-repository'
import { makeQuestion } from '../../../../test/factories/make-question'
import { makeOptionAnswer } from '../../../../test/factories/make-option-answer'

let inMemoryInterviewRepository: InMemoryInterviewRepository
let sut: GenerateSimpleReportPdfUseCase

describe('Generate simple report PDF', () => {
  beforeEach(() => {
    inMemoryInterviewRepository = new InMemoryInterviewRepository()
    sut = new GenerateSimpleReportPdfUseCase(inMemoryInterviewRepository)
  })

  it('should generate a PDF buffer with charts', async () => {
    // Setup factories para dados realistas
    const surveyId = new UniqueEntityID('survey-1')
    const question = makeQuestion({
      surveyId,
      questionNum: 1,
      questionTitle: 'Qual sua cor favorita?',
    })
    const option1 = makeOptionAnswer({
      questionId: question.id,
      optionNum: 1,
      optionTitle: 'Azul',
    })
    const option2 = makeOptionAnswer({
      questionId: question.id,
      optionNum: 2,
      optionTitle: 'Vermelho',
    })

    // Mock dados COMPLETOS e realistas com múltiplas respostas
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
                questionId: question.id.toString(),
                title: question.questionTitle,
                number: question.questionNum,
              },
              option: {
                optionId: option1.id.toString(),
                title: option1.optionTitle,
                number: option1.optionNum,
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
              answerId: 'answer-2',
              question: {
                questionId: question.id.toString(),
                title: question.questionTitle,
                number: question.questionNum,
              },
              option: {
                optionId: option2.id.toString(),
                title: option2.optionTitle,
                number: option2.optionNum,
              },
            },
          ],
        },
      ],
      total: 2,
    }

    inMemoryInterviewRepository.findBySurveyId = vi
      .fn()
      .mockResolvedValue(mockData as any)

    const result = await sut.execute('survey-1', 'account-1')

    expect(result).toBeInstanceOf(Buffer)
    expect(result.length).toBeGreaterThan(1500) // PDF mínimo realista com charts
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
