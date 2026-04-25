import { expect, beforeEach, describe, it, vi } from 'vitest'
import { GenerateCrossReportPdfUseCase } from './generate-cross-report-pdf'
import { GenerateCrossReportUseCase } from './generate-cross-report'

let generateCrossReportUseCase: GenerateCrossReportUseCase
let sut: GenerateCrossReportPdfUseCase

describe('Generate cross report PDF', () => {
  beforeEach(() => {
    generateCrossReportUseCase = {
      execute: vi.fn(),
    } as any
    sut = new GenerateCrossReportPdfUseCase(generateCrossReportUseCase)
  })

  it('should generate a PDF buffer with cross charts/tables', async () => {
    const mockCrossData = [
      {
        questionA: 'Qual sua idade?',
        questionANum: 1,
        questionAId: 'q1',
        questionB: 'Qual sua cor favorita?',
        questionBNum: 2,
        questionBId: 'q2',
        answers: [
          { numA: 1, answerA: '18-25', numB: 1, answerB: 'Azul', percentage: 25.0 },
          { numA: 1, answerA: '18-25', numB: 2, answerB: 'Vermelho', percentage: 75.0 },
        ],
      },
    ]

    generateCrossReportUseCase.execute = vi.fn().mockResolvedValue(mockCrossData)

    const result = await sut.execute('survey-1', 'account-1')

    expect(result).toBeInstanceOf(Buffer)
    expect(result.length).toBeGreaterThan(1500)
    expect(generateCrossReportUseCase.execute).toHaveBeenCalledWith('survey-1', 'account-1')
  })

  it('should throw error when no cross data found', async () => {
    generateCrossReportUseCase.execute = vi.fn().mockResolvedValue([])

    await expect(sut.execute('survey-1', 'account-1')).rejects.toThrow('Nenhum dado cruzado encontrado')
  })
})
