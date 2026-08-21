import { Either, left, right } from '@/core/types/either'
import { AnswerQuestion } from '../../entities/answer-question'
import { AnswerQuestionRepository } from '../../repositories/answer-question-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Injectable } from '@nestjs/common'
import { InterviewRepository } from '../../repositories/interview-repository'
import { QuestionRepository } from '../../repositories/question-repository'
import { OptionAnswerRepository } from '../../repositories/option-answer-repository'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'

interface CreateAnswerQuestionUseCaseRequest {
  interviewId: string
  questionId: string
  optionAnswerId: string
  accountId: string
}

type CreateQuestionUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    answerQuestion: AnswerQuestion
  }
>

@Injectable()
export class CreateAnswerQuestionUseCase {
  constructor(
    private answerquestionRepository: AnswerQuestionRepository,
    private interviewRepository: InterviewRepository,
    private questionRepository: QuestionRepository,
    private optionAnswerRepository: OptionAnswerRepository,
  ) {}

  async execute({
    interviewId,
    questionId,
    optionAnswerId,
    accountId,
  }: CreateAnswerQuestionUseCaseRequest): Promise<CreateQuestionUseCaseResponse> {
    const [interview, question, optionAnswer] = await Promise.all([
      this.interviewRepository.findByIdAndAccountId(interviewId, accountId),
      this.questionRepository.findByIdAndAccountId(questionId, accountId),
      this.optionAnswerRepository.findByIdAndQuestionIdAndAccountId(
        optionAnswerId,
        questionId,
        accountId,
      ),
    ])

    if (
      !interview ||
      !question ||
      !optionAnswer ||
      interview.surveyId.toString() !== question.surveyId.toString()
    ) {
      return left(new ResourceNotFoundError())
    }

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
