import { expect, beforeEach, describe, it, vi } from 'vitest'
import { GenerateSimpleReportWordUseCase } from './generate-simple-report-word'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { InMemoryInterviewRepository } from '../../../../test/repositories/in-memory-interview-repository'
import { makeQuestion } from '../../../../test/factories/make-question'
import { makeOptionAnswer } from '../../../../test/factories/make-option-answer'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import JSZip from 'jszip'

let inMemoryInterviewRepository: InMemoryInterviewRepository
let sut: GenerateSimpleReportWordUseCase

describe('Generate simple report word', () => {
  beforeEach(() => {
    inMemoryInterviewRepository = new InMemoryInterviewRepository()
    sut = new GenerateSimpleReportWordUseCase(inMemoryInterviewRepository)
  })

  it('should generate a Word document buffer', async () => {
    // Setup factories para dados realistas
    const surveyId = new UniqueEntityID('survey-1')
    const question = makeQuestion({
      surveyId,
      questionNum: 1,
      questionTitle: '<script>alert("x")</script> Qual sua cor favorita?',
    })
    const option = makeOptionAnswer({
      questionId: question.id,
      optionNum: 1,
      optionTitle: 'Azul',
    })

    // Mock dados COMPLETOS e realistas
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
                optionId: option.id.toString(),
                title: option.optionTitle,
                number: option.optionNum,
              },
            },
          ],
        },
      ],
      total: 1,
    }

    inMemoryInterviewRepository.findBySurveyId = vi
      .fn()
      .mockResolvedValue(mockData)

    const result = await sut.execute('survey-1', 'account-1')

    expect(result).toBeInstanceOf(Buffer)
    expect(result.length).toBeGreaterThan(1_000)
    expect(result.subarray(0, 2).toString()).toBe('PK')
    const documentXml = await readDocumentXml(result)
    expect(documentXml).toContain('Relatório Simples da Pesquisa')
    expect(documentXml).toContain(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; Qual sua cor favorita?',
    )
    expect(documentXml).toContain('Azul')
    expect(documentXml).toContain('100.00%')
    expect(documentXml).not.toContain('<script>')
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
      ResourceNotFoundError,
    )
  })
})

async function readDocumentXml(document: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(document)
  const entry = zip.file('word/document.xml')
  if (!entry) throw new Error('DOCX does not contain word/document.xml')
  return entry.async('string')
}
