import { Either, right } from 'src/core/types/either'
import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { AnswerQuestion } from '../../entities/answer-question'
import { AnswerQuestionRepository } from '../../repositories/answer-question-repository'
import { Slug } from '../../entities/value-objects/slug'

interface CreateAnswerQuestionUseCaseRequest {
  interviewId: UniqueEntityID
  questionId: UniqueEntityID
  optionAnswerId: UniqueEntityID
  slug?: Slug
}

type CreateQuestionUseCaseResponse = Either<
  null,
  {
    answerQuestion: AnswerQuestion
  }
>

export class CreateAnswerQuestionUseCase {
  constructor(private answerquestionRepository: AnswerQuestionRepository) {}

  async execute({
    interviewId,
    questionId,
    optionAnswerId,
  }: CreateAnswerQuestionUseCaseRequest): Promise<CreateQuestionUseCaseResponse> {
    const answerQuestion = AnswerQuestion.create({
      interviewId,
      questionId,
      optionAnswerId,
    })

    await this.answerquestionRepository.create(answerQuestion)

    return right({
      answerQuestion,
    })
  }
}
