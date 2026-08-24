import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { InMemoryAnswerQuestionRepository } from 'test/repositories/in-memory-answer-question-repository'
import { InMemoryInterviewRepository } from 'test/repositories/in-memory-interview-repository'
import { InMemoryQuestionRepository } from 'test/repositories/in-memory-question-repository'
import { InMemoryOptionAnswersRepository } from 'test/repositories/in-memory-option-answer-repository'
import { makeAnswerQuestion } from 'test/factories/make-answer-question'
import { makeInterview } from 'test/factories/make-interview'
import { makeQuestion } from 'test/factories/make-question'
import { makeOptionAnswer } from 'test/factories/make-option-answer'
import { EditAnswerQuestionUseCase } from './edit-answer-question'

describe('Edit AnswerQuestion', () => {
  let answers: InMemoryAnswerQuestionRepository
  let interviews: InMemoryInterviewRepository
  let questions: InMemoryQuestionRepository
  let options: InMemoryOptionAnswersRepository
  let sut: EditAnswerQuestionUseCase

  beforeEach(() => {
    answers = new InMemoryAnswerQuestionRepository()
    interviews = new InMemoryInterviewRepository()
    questions = new InMemoryQuestionRepository()
    options = new InMemoryOptionAnswersRepository()
    sut = new EditAnswerQuestionUseCase(answers, interviews, questions, options)
  })

  async function arrange(accountId = 'account-1', surveyId = 'survey-1') {
    const account = new UniqueEntityID(accountId)
    const interview = makeInterview({
      accountId: account,
      surveyId: new UniqueEntityID(surveyId),
    })
    const question = makeQuestion({
      accountId: account,
      surveyId: interview.surveyId,
    })
    const option = makeOptionAnswer({
      accountId: account,
      questionId: question.id,
    })
    const answer = makeAnswerQuestion({
      accountId: account,
      interviewId: interview.id,
      questionId: question.id,
      optionAnswerId: option.id,
    })
    await interviews.create(interview)
    await questions.create(question)
    await options.create(option)
    await answers.create(answer)
    return { answer, interview, question }
  }

  it('edits an answer with a valid question and option', async () => {
    const { answer, interview } = await arrange()
    const question = makeQuestion({
      accountId: answer.accountId,
      surveyId: interview.surveyId,
    })
    const option = makeOptionAnswer({
      accountId: answer.accountId,
      questionId: question.id,
    })
    await questions.create(question)
    await options.create(option)

    const result = await sut.execute({
      answerQuestionId: answer.id.toString(),
      optionAnswerId: option.id.toString(),
      accountId: answer.accountId.toString(),
      questionId: question.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    expect(answer.questionId).toEqual(question.id)
    expect(answer.optionAnswerId).toEqual(option.id)
  })

  it('returns the same not-found result for missing and foreign answers', async () => {
    const { answer } = await arrange('owner')
    for (const answerQuestionId of ['missing', answer.id.toString()]) {
      const result = await sut.execute({
        answerQuestionId,
        accountId: 'other-user',
      })
      expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    }
  })

  it.each(['wrong-question', 'wrong-survey', 'wrong-account'])(
    'rejects cross-tenant or inconsistent association: %s',
    async (scenario) => {
      const { answer, question: originalQuestion } = await arrange()
      const question =
        scenario === 'wrong-survey'
          ? makeQuestion({
              accountId: answer.accountId,
              surveyId: new UniqueEntityID('survey-2'),
            })
          : originalQuestion
      if (question !== originalQuestion) await questions.create(question)
      const option = makeOptionAnswer({
        accountId:
          scenario === 'wrong-account'
            ? new UniqueEntityID('other-user')
            : answer.accountId,
        questionId:
          scenario === 'wrong-question'
            ? new UniqueEntityID('different-question')
            : question.id,
      })
      await options.create(option)

      const result = await sut.execute({
        answerQuestionId: answer.id.toString(),
        accountId: answer.accountId.toString(),
        questionId: question.id.toString(),
        optionAnswerId: option.id.toString(),
      })

      expect(result.value).toBeInstanceOf(ResourceNotFoundError)
      expect(answer.questionId).toEqual(originalQuestion.id)
    },
  )
})
