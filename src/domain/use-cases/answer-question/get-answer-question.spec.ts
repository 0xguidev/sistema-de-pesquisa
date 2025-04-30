import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { InMemoryAnswerQuestionRepository } from 'test/repositories/in-memory-answer-question-repository'
import { GetAnswerQuestionUseCase } from './get-answer-question'
import { makeAnswerQuestion } from 'test/factories/make-answer-question'

let inMemoryAnswerQuestionRepository: InMemoryAnswerQuestionRepository
let sut: GetAnswerQuestionUseCase

describe('Get AnswerQuestion', () => {
  beforeEach(() => {
    inMemoryAnswerQuestionRepository = new InMemoryAnswerQuestionRepository()
    sut = new GetAnswerQuestionUseCase(inMemoryAnswerQuestionRepository)
  })

  it('Should be able to get a answerquestion', async () => {
    const answerquestion = makeAnswerQuestion()

    await inMemoryAnswerQuestionRepository.create(answerquestion)
    
    const existsAnswerQuestion = await sut.execute({
      answerQuestionId: answerquestion.id.toString(),
    })

    expect(existsAnswerQuestion.isRight()).toBe(true)
    if (!(existsAnswerQuestion.value instanceof Error)) {
      expect(inMemoryAnswerQuestionRepository.items[0]).toEqual(
        existsAnswerQuestion.value.answerQuestion,
      )
    }
  })
})
