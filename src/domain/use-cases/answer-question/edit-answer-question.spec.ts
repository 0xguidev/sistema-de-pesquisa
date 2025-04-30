import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { InMemoryAnswerQuestionRepository } from 'test/repositories/in-memory-answer-question-repository'
import { EditAnswerQuestionUseCase } from './edit-answer-question'
import { makeAnswerQuestion } from 'test/factories/make-answer-question'

let inMemoryAnswerQuestionsRepository: InMemoryAnswerQuestionRepository
let sut: EditAnswerQuestionUseCase

describe('Edit AnswerQuestion', () => {
  beforeEach(() => {
    inMemoryAnswerQuestionsRepository = new InMemoryAnswerQuestionRepository()
    sut = new EditAnswerQuestionUseCase(inMemoryAnswerQuestionsRepository)
  })

  it('Should be able to edit a answerquestion', async () => {
    const answerQuestion = makeAnswerQuestion()

    await inMemoryAnswerQuestionsRepository.create(answerQuestion)

    answerQuestion.optionAnswerId = new UniqueEntityID('new_title')

    const editedAnswerQuestion = await sut.execute({
      id: answerQuestion.id.toString(),
      optionAnswerId: answerQuestion.optionAnswerId.toString(),
    })

    expect(editedAnswerQuestion.isRight()).toBe(true)
    if ('answerquestion' in editedAnswerQuestion.value) {
      expect(inMemoryAnswerQuestionsRepository.items[0]).toEqual(
        editedAnswerQuestion.value.answerquestion,
      )
    }
  })
})
