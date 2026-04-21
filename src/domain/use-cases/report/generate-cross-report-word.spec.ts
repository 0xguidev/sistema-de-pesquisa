import { expect, beforeEach, describe, it, vi } from 'vitest'
import { GenerateCrossReportWordUseCase } from './generate-cross-report-word'
import { InMemoryInterviewRepository } from 'test/repositories/in-memory-interview-repository'
import { InMemoryQuestionRepository } from 'test/repositories/in-memory-question-repository'
import { InMemoryOptionAnswersRepository } from 'test/repositories/in-memory-option-answer-repository'
import { makeQuestion } from 'test/factories/make-question'
import { makeOptionAnswer } from 'test/factories/make-option-answer'
import { UniqueEntityID } from 'src/core/entities/unique-entity-id'

let inMemoryInterviewRepository: InMemoryInterviewRepository
let inMemoryQuestionRepository: InMemoryQuestionRepository
let inMemoryOptionAnswersRepository: InMemoryOptionAnswersRepository
let sut: GenerateCrossReportWordUseCase

describe('Generate Cross Report Word', () => {
  beforeEach(async () => {
    inMemoryQuestionRepository = new InMemoryQuestionRepository()
    inMemoryOptionAnswersRepository = new InMemoryOptionAnswersRepository()
    inMemoryInterviewRepository = new InMemoryInterviewRepository()

    sut = new GenerateCrossReportWordUseCase(
      inMemoryInterviewRepository,
      inMemoryQuestionRepository,
      inMemoryOptionAnswersRepository,
    )
  })

  it('should generate a Word document buffer', async () => {
    // Setup data
    const surveyId = new UniqueEntityID('survey-1')

    const question1 = makeQuestion({
      surveyId: surveyId,
      questionNum: 1,
      questionTitle: 'Qual sua cor favorita?',
    })
    const question2 = makeQuestion({
      surveyId: surveyId,
      questionNum: 2,
      questionTitle: 'Qual seu animal favorito?',
    })

    const option1Q1 = makeOptionAnswer({
      questionId: question1.id,
      optionNum: 1,
      optionTitle: 'Azul',
    })
    const option1Q2 = makeOptionAnswer({
      questionId: question2.id,
      optionNum: 1,
      optionTitle: 'Cachorro',
    })

    await inMemoryQuestionRepository.create(question1)
    await inMemoryQuestionRepository.create(question2)
    await inMemoryOptionAnswersRepository.create(option1Q1)
    await inMemoryOptionAnswersRepository.create(option1Q2)

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
      ],
      total: 1,
    }

    inMemoryInterviewRepository.findBySurveyId = vi.fn().mockResolvedValue(mockData)

    const result = await sut.execute('survey-1', 'account-1')

    expect(result).toBeInstanceOf(Buffer)
    expect(result.length).toBeGreaterThan(0)
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
