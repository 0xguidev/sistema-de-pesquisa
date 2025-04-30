import { Either, right } from 'src/core/types/either'
import { AnswerQuestion } from '../../entities/answer-question'
import { AnswerQuestionRepository } from '../../repositories/answer-question-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Injectable } from '@nestjs/common'

interface CreateAnswerQuestionUseCaseRequest {
  interviewId: string
  questionId: string
  optionAnswerId: string
  accountId: string
}

type CreateQuestionUseCaseResponse = Either<
  null,
  {
    answerQuestion: AnswerQuestion
  }
>

@Injectable()
export class CreateAnswerQuestionUseCase {
  constructor(private answerquestionRepository: AnswerQuestionRepository) {}

  async execute({
    interviewId,
    questionId,
    optionAnswerId,
    accountId,
  }: CreateAnswerQuestionUseCaseRequest): Promise<CreateQuestionUseCaseResponse> {
    const answerQuestion = AnswerQuestion.create({
      interviewId: new UniqueEntityID(interviewId),
      questionId: new UniqueEntityID(questionId),
      optionAnswerId: new UniqueEntityID(optionAnswerId),
      accountId: new UniqueEntityID(accountId),
    })

    await this.answerquestionRepository.create(answerQuestion)

    return right({
      answerQuestion,
    })
  }
}
