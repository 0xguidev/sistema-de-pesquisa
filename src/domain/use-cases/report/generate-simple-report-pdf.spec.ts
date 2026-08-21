import { expect, beforeEach, describe, it, vi } from 'vitest'
import { GenerateSimpleReportPdfUseCase } from './generate-simple-report-pdf'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { InMemoryInterviewRepository } from '../../../../test/repositories/in-memory-interview-repository'
import { makeQuestion } from '../../../../test/factories/make-question'
import { makeOptionAnswer } from '../../../../test/factories/make-option-answer'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'

const chromium = vi.hoisted(() => {
  let requestHandler: ((request: any) => void) | undefined

  const page = {
    setDefaultNavigationTimeout: vi.fn(),
    setDefaultTimeout: vi.fn(),
    setRequestInterception: vi.fn().mockResolvedValue(undefined),
    on: vi.fn((event: string, handler: (request: any) => void) => {
      if (event === 'request') requestHandler = handler
    }),
    setContent: vi.fn().mockResolvedValue(undefined),
    pdf: vi
      .fn()
      .mockResolvedValue(
        Buffer.concat([Buffer.from('%PDF-1.7'), Buffer.alloc(1_992)]),
      ),
    isClosed: vi.fn().mockReturnValue(false),
    close: vi.fn().mockResolvedValue(undefined),
  }
  const browser = {
    newPage: vi.fn().mockResolvedValue(page),
    close: vi.fn().mockResolvedValue(undefined),
  }

  return {
    page,
    browser,
    launch: vi.fn().mockResolvedValue(browser),
    getRequestHandler: () => requestHandler,
    resetRequestHandler: () => {
      requestHandler = undefined
    },
  }
})

vi.mock('puppeteer', () => ({
  default: { launch: chromium.launch },
}))

let inMemoryInterviewRepository: InMemoryInterviewRepository
let sut: GenerateSimpleReportPdfUseCase

describe('Generate simple report PDF', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chromium.resetRequestHandler()
    chromium.page.setRequestInterception.mockResolvedValue(undefined)
    chromium.page.setContent.mockResolvedValue(undefined)
    chromium.page.pdf.mockResolvedValue(
      Buffer.concat([Buffer.from('%PDF-1.7'), Buffer.alloc(1_992)]),
    )
    chromium.page.isClosed.mockReturnValue(false)
    chromium.page.close.mockResolvedValue(undefined)
    chromium.browser.newPage.mockResolvedValue(chromium.page)
    chromium.browser.close.mockResolvedValue(undefined)
    chromium.launch.mockResolvedValue(chromium.browser)
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
      .mockResolvedValue(mockData)

    const result = await sut.execute('survey-1', 'account-1')

    expect(result).toBeInstanceOf(Buffer)
    expect(result.length).toBeGreaterThan(1500) // PDF mínimo realista com charts
    expect(result.subarray(0, 5).toString()).toBe('%PDF-')
    const generatedHtml = chromium.page.setContent.mock.calls[0][0]
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
    expect(chromium.launch).toHaveBeenCalledWith(
      expect.not.objectContaining({
        args: expect.arrayContaining([
          '--no-sandbox',
          '--disable-setuid-sandbox',
        ]),
      }),
    )
    expect(chromium.page.setRequestInterception).toHaveBeenCalledWith(true)
  })

  it.each([
    'https://example.com/tracker.png',
    'http://example.com/redirect-to-private',
    'ws://example.com/socket',
    'wss://example.com/socket',
    'file:///etc/passwd',
    'http://localhost/admin',
    'http://127.0.0.1/admin',
    'http://127.1/admin',
    'http://10.0.0.1/internal',
    'http://172.16.0.1/internal',
    'http://192.168.0.1/internal',
    'http://169.254.169.254/latest/meta-data',
    'http://metadata.google.internal/computeMetadata/v1',
    'http://[::1]/admin',
    'http://[fc00::1]/internal',
    'http://[fe80::1]/internal',
    'http://2130706433/admin',
  ])('should block a PDF page request to %s', async (url) => {
    inMemoryInterviewRepository.findBySurveyId = vi
      .fn()
      .mockResolvedValue(createInterviews())

    await sut.execute('survey-1', 'account-1')

    const request = createRequest(url)
    chromium.getRequestHandler()?.(request)

    expect(request.abort).toHaveBeenCalledWith('blockedbyclient')
    expect(request.continue).not.toHaveBeenCalled()
  })

  it('should only allow the local document and data URLs', async () => {
    inMemoryInterviewRepository.findBySurveyId = vi
      .fn()
      .mockResolvedValue(createInterviews())

    await sut.execute('survey-1', 'account-1')

    for (const url of ['about:blank', 'data:image/png;base64,AA==']) {
      const request = createRequest(url)
      chromium.getRequestHandler()?.(request)
      expect(request.continue).toHaveBeenCalledOnce()
      expect(request.abort).not.toHaveBeenCalled()
    }
  })

  it('should close the page and browser when PDF generation fails', async () => {
    inMemoryInterviewRepository.findBySurveyId = vi
      .fn()
      .mockResolvedValue(createInterviews())
    chromium.page.pdf.mockRejectedValueOnce(new Error('PDF timeout'))

    await expect(sut.execute('survey-1', 'account-1')).rejects.toThrow(
      'PDF timeout',
    )

    expect(chromium.page.close).toHaveBeenCalledOnce()
    expect(chromium.browser.close).toHaveBeenCalledOnce()
  })

  it('should close the browser even when closing the page fails', async () => {
    inMemoryInterviewRepository.findBySurveyId = vi
      .fn()
      .mockResolvedValue(createInterviews())
    chromium.page.pdf.mockRejectedValueOnce(new Error('PDF timeout'))
    chromium.page.close.mockRejectedValueOnce(new Error('Page close failed'))

    await expect(sut.execute('survey-1', 'account-1')).rejects.toThrow(
      'Page close failed',
    )

    expect(chromium.browser.close).toHaveBeenCalledOnce()
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

function createInterviews() {
  return {
    data: [
      {
        answers: [
          {
            question: {
              questionId: 'question-1',
              title: 'Pergunta',
              number: 1,
            },
            option: { title: 'Resposta', number: 1 },
          },
        ],
      },
    ],
    total: 1,
  }
}

function createRequest(url: string) {
  return {
    url: vi.fn().mockReturnValue(url),
    continue: vi.fn().mockResolvedValue(undefined),
    abort: vi.fn().mockResolvedValue(undefined),
  }
}
