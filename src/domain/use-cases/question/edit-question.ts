import { NotAllowedError } from 'src/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from 'src/core/errors/errors/resource-not-found-error'
import { Either, left, right } from 'src/core/types/either'
import { Question } from '../../entities/question'
import { QuestionRepository } from '../../repositories/question-repository'
import { Injectable } from '@nestjs/common'

interface EditQuestionUseCaseRequest {
  questionId: string
  accountId: string
  questionTitle?: string
  questionNum?: number
}

type EditQuestionUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  {
    question: Question
  }
>

@Injectable()
export class EditQuestionUseCase {
  constructor(private questionsRepository: QuestionRepository) {}

  async execute({
    questionId,
    accountId,
    questionTitle,
    questionNum,
  }: EditQuestionUseCaseRequest): Promise<EditQuestionUseCaseResponse> {
    const question = await this.questionsRepository.findById(questionId)

    if (!question) {
      return left(new ResourceNotFoundError())
    }

    if (question.accountId.toString() !== accountId) {
      return left(new NotAllowedError())
    }
    
    question.questionTitle = questionTitle ?? question.questionTitle
    question.questionNum = questionNum ?? question.questionNum

    await this.questionsRepository.update(question)

    return right({
      question,
    })
  }
}
