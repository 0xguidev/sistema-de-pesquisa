import { expect, beforeEach, describe, it, vi } from 'vitest'
import { GenerateCrossTabulationWordUseCase } from './generate-cross-tabulation-word'
import { InterviewRepository } from 'src/domain/repositories/interview-repository'

let interviewRepository: InterviewRepository
let sut: GenerateCrossTabulationWordUseCase

describe('Generate Cross Tabulation Report Word', () => {
  beforeEach(() => {
    interviewRepository = {
      findBySurveyId: vi.fn(),
      create: vi.fn(),
      findById: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    } as InterviewRepository

    sut = new GenerateCrossTabulationWordUseCase(interviewRepository)
  })

  it('should generate a Word document buffer', async () => {
    const mockData = {
      data: [{
        id: 'interview-1',
        surveyId: 'survey-1',
        accountId: 'account-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        answers: [
          {
            answerId: 'answer-1',
            question: {
              questionId: 'question-1',
              title: 'Qual sua cor favorita?',
              number: 1,
            },
            option: {
              optionId: 'option-1',
              title: 'Azul',
              number: 1,
            },
          },
          {
            answerId: 'answer-2',
            question: {
              questionId: 'question-2',
              title: 'Qual seu animal favorito?',
              number: 2,
            },
            option: {
              optionId: 'option-2',
              title: 'Cachorro',
              number: 1,
            },
          },
        ],
      }],
      total: 1,
    }

    vi.mocked(interviewRepository.findBySurveyId).mockResolvedValue(mockData)

    const result = await sut.execute('survey-1', 'account-1')

    expect(result).toBeInstanceOf(Buffer)
    expect(result.length).toBeGreaterThan(0)
    expect(interviewRepository.findBySurveyId).toHaveBeenCalledWith('survey-1', 'account-1', 1, 1000)
  })

  it('should throw error when no interviews found', async () => {
    const mockData = {
      data: [],
      total: 0,
    }

    vi.mocked(interviewRepository.findBySurveyId).mockResolvedValue(mockData)

    await expect(sut.execute('survey-1', 'account-1')).rejects.toThrow(
      'Nenhuma entrevista encontrada para gerar relatório'
    )
  })
})
