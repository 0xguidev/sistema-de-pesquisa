import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Injectable } from '@nestjs/common'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { Either, left, right } from '@/core/types/either'
import { AnswerQuestion } from '@/domain/entities/answer-question'
import { AnswerQuestionRepository } from '@/domain/repositories/answer-question-repository'
import { InterviewRepository } from '@/domain/repositories/interview-repository'
import { QuestionRepository } from '@/domain/repositories/question-repository'
import { OptionAnswerRepository } from '@/domain/repositories/option-answer-repository'

interface EditAnswerQuestionUseCaseRequest {
  accountId: string
  answerQuestionId: string
  questionId?: string
  optionAnswerId?: string
}

type EditAnswerQuestionUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    answerquestion: AnswerQuestion
  }
>

@Injectable()
export class EditAnswerQuestionUseCase {
  constructor(
    private answerquestionsRepository: AnswerQuestionRepository,
    private interviewRepository: InterviewRepository,
    private questionRepository: QuestionRepository,
    private optionAnswerRepository: OptionAnswerRepository,
  ) {}

  async execute({
    accountId,
    answerQuestionId,
    questionId,
    optionAnswerId,
  }: EditAnswerQuestionUseCaseRequest): Promise<EditAnswerQuestionUseCaseResponse> {
    const answerquestion =
      await this.answerquestionsRepository.findByIdAndAccountId(
        answerQuestionId,
        accountId,
      )

    if (!answerquestion) {
      return left(new ResourceNotFoundError())
    }

    const interview = await this.interviewRepository.findByIdAndAccountId(
      answerquestion.interviewId.toString(),
      accountId,
    )

    const nextQuestionId = questionId ?? answerquestion.questionId.toString()
    const nextOptionAnswerId =
      optionAnswerId ?? answerquestion.optionAnswerId.toString()

    const question = await this.questionRepository.findByIdAndAccountId(
      nextQuestionId,
      accountId,
    )
    const option =
      await this.optionAnswerRepository.findByIdAndQuestionIdAndAccountId(
        nextOptionAnswerId,
        nextQuestionId,
        accountId,
      )

    if (
      !interview ||
      !question ||
      !option ||
      question.surveyId.toString() !== interview.surveyId.toString()
    ) {
      return left(new ResourceNotFoundError())
    }

    answerquestion.optionAnswerId = new UniqueEntityID(nextOptionAnswerId)
    answerquestion.questionId = new UniqueEntityID(nextQuestionId)

    await this.answerquestionsRepository.update(answerquestion)

    return right({
      answerquestion,
    })
  }
}
