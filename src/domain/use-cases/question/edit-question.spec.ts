import { makeQuestion } from 'test/factories/make-question'
import { EditQuestionUseCase } from './edit-question'
import { InMemoryQuestionRepository } from 'test/repositories/in-memory-question-repository'
import { UniqueEntityID } from 'src/core/entities/unique-entity-id'

let inMemoryQuestionsRepository: InMemoryQuestionRepository
let sut: EditQuestionUseCase

describe('Edit Question', () => {
  beforeEach(() => {
    inMemoryQuestionsRepository = new InMemoryQuestionRepository()
    sut = new EditQuestionUseCase(inMemoryQuestionsRepository)
  })

  it('Should be able to edit a question', async () => {
    const question = makeQuestion(
      { questionTitle: 'any_title', questionNum: 1 },
      new UniqueEntityID(),
    )

    await inMemoryQuestionsRepository.create(question)

    const editedQuestion = await sut.execute({
      questionId: question.id.toString(),
      questionTitle: 'new_title',
      questionNum: 2,
    })

    expect(editedQuestion.isRight()).toBe(true)
    if ('question' in editedQuestion.value) {
      expect(inMemoryQuestionsRepository.items[0]).toEqual(
        editedQuestion.value.question,
      )
    }
  })
})
