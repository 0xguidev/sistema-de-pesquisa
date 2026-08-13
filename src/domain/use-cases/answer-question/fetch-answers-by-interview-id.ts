import { Either, right } from '@/core/types/either'
import { AnswerQuestionRepository } from '@/domain/repositories/answer-question-repository'
import { Injectable } from '@nestjs/common'

interface FetchAnswersByInterviewIdUseCaseRequest {
  interviewId: string
  accountId: string
}

type FetchAnswersByInterviewIdUseCaseResponse = Either<
  null,
  Array<{
    id: string
    interviewId: string
    questionId: string
    optionAnswerId: string
    accountId: string
    createdAt: Date
    updatedAt: Date | null | undefined
  }>
>

@Injectable()
export class FetchAnswersByInterviewIdUseCase {
  constructor(private answerQuestionRepository: AnswerQuestionRepository) {}

  async execute({
    interviewId,
    accountId,
  }: FetchAnswersByInterviewIdUseCaseRequest): Promise<FetchAnswersByInterviewIdUseCaseResponse> {
    const answers = await this.answerQuestionRepository.findManyByInterviewId(
      interviewId,
      accountId,
    )

    return right(
      answers.map((answer) => ({
        id: answer.id.toString(),
        interviewId: answer.interviewId.toString(),
        questionId: answer.questionId.toString(),
        optionAnswerId: answer.optionAnswerId.toString(),
        accountId: answer.accountId.toString(),
        createdAt: answer.createdAt,
        updatedAt: answer.updatedAt,
      })),
    )
  }
}
