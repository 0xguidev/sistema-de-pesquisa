import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { Question } from '../../entities/question'
import { QuestionRepository } from '../../repositories/question-repository'
import { Either, right } from 'src/core/types/either'
import { Injectable } from '@nestjs/common'

interface CreateQuestionUseCaseRequest {
  questionTitle: string
  questionNum: number
  surveyId: string
  accountId: string
}

export type CreateQuestionUseCaseResponse = Either<
  null,
  {
    question: Question
  }
>

@Injectable()
export class CreateQuestionUseCase {
  constructor(private questionRepository: QuestionRepository) {}

  async execute({
    questionTitle,
    questionNum,
    surveyId,
    accountId,
  }: CreateQuestionUseCaseRequest): Promise<CreateQuestionUseCaseResponse> {
    const question = Question.create({
      questionTitle,
      questionNum,
      surveyId: new UniqueEntityID(surveyId),
      accountId: new UniqueEntityID(accountId),
    })

    await this.questionRepository.create(question)

    return right({
      question,
    })
  }
}
