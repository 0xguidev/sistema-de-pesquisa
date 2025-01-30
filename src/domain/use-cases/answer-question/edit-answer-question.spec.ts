import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { InMemoryAnswerQuestionRepository } from 'src/test/repositories/in-memory-answer-question-repository'
import { EditAnswerQuestionUseCase } from './edit-answer-question'
import { makeAnswerQuestion } from 'src/test/factories/make-answer-question'

let inMemoryAnswerQuestionsRepository: InMemoryAnswerQuestionRepository
let sut: EditAnswerQuestionUseCase

describe('Edit AnswerQuestion', () => {
  beforeEach(() => {
    inMemoryAnswerQuestionsRepository = new InMemoryAnswerQuestionRepository()
    sut = new EditAnswerQuestionUseCase(inMemoryAnswerQuestionsRepository)
  })

  it('Should be able to edit a answerquestion', async () => {
    const answerquestion = makeAnswerQuestion(
      {
        questionId: new UniqueEntityID(),
        interviewId: new UniqueEntityID(),
        optionAnswerId: new UniqueEntityID(),
      },
      new UniqueEntityID(),
    )

    await inMemoryAnswerQuestionsRepository.create(answerquestion)

    const editedAnswerQuestion = await sut.execute({
      questionId: new UniqueEntityID('newQuestionId'),
      interviewId: new UniqueEntityID('newinterViewId'),
      optionAnswerId: new UniqueEntityID('newOptionAnswerId'),
      id: answerquestion.id,
    })

    expect(editedAnswerQuestion.isRight()).toBe(true)
    if ('answerquestion' in editedAnswerQuestion.value) {
      expect(inMemoryAnswerQuestionsRepository.items[0]).toEqual(
        editedAnswerQuestion.value.answerquestion,
      )
    }
  })
})
