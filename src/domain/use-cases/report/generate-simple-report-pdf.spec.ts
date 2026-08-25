import { expect, beforeEach, describe, it, vi } from 'vitest'
import { GenerateSimpleReportPdfUseCase } from './generate-simple-report-pdf'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { InMemoryInterviewRepository } from '../../../../test/repositories/in-memory-interview-repository'
import { makeQuestion } from '../../../../test/factories/make-question'
import { makeOptionAnswer } from '../../../../test/factories/make-option-answer'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { ReportProtection } from './report-protection'
import { PdfRenderer } from './pdf-renderer'

let inMemoryInterviewRepository: InMemoryInterviewRepository
let sut: GenerateSimpleReportPdfUseCase
let renderer: { render: ReturnType<typeof vi.fn> }

describe('Generate simple report PDF', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    renderer = {
      render: vi
        .fn()
        .mockResolvedValue(
          Buffer.concat([Buffer.from('%PDF-1.7'), Buffer.alloc(1_992)]),
        ),
    }
    inMemoryInterviewRepository = new InMemoryInterviewRepository()
    const protection = {
      maxInterviews: 1000,
      timeoutMs: 30000,
      validateInterviews: vi.fn(),
      validateDocument: vi.fn(),
      withPdfSlot: vi.fn(
        (
          _accountId: string,
          operation: (signal: AbortSignal) => Promise<Buffer>,
        ) => operation(new AbortController().signal),
      ),
    } as unknown as ReportProtection
    sut = new GenerateSimpleReportPdfUseCase(
      inMemoryInterviewRepository,
      protection,
      renderer as unknown as PdfRenderer,
    )
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
      .mockResolvedValue(mockData)

    const result = await sut.execute('survey-1', 'account-1')

    expect(result).toBeInstanceOf(Buffer)
    expect(result.length).toBeGreaterThan(1500) // PDF mínimo realista com charts
    expect(result.subarray(0, 5).toString()).toBe('%PDF-')
    const generatedHtml = renderer.render.mock.calls[0][0]
    expect(generatedHtml).toContain('Qual sua cor favorita?')
    expect(generatedHtml).toContain('Azul')
    expect(generatedHtml).toContain('Vermelho')
    expect(generatedHtml).toContain('50%')
    expect(inMemoryInterviewRepository.findBySurveyId).toHaveBeenCalledWith(
      'survey-1',
      'account-1',
      1,
      1000,
    )
    expect(renderer.render).toHaveBeenCalledWith(generatedHtml, {
      timeoutMs: 30000,
      signal: expect.any(AbortSignal),
    })
  })

  it('should throw error when no interviews found', async () => {
    inMemoryInterviewRepository.findBySurveyId = vi.fn().mockResolvedValue({
      data: [],
      total: 0,
    })

    await expect(sut.execute('survey-1', 'account-1')).rejects.toThrow(
      ResourceNotFoundError,
    )
  })
})
