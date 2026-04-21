import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '@/app.module'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { AccountFactory } from 'test/factories/make-Account'
import { InterviewFactory } from 'test/factories/make-interview'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

describe('Report Controllers (E2E)', () => {
  let app: INestApplication
  let jwt: JwtService
  let prisma: PrismaService
  let accessToken: string
  let userId: string
  let accountFactory: AccountFactory
  let interviewFactory: InterviewFactory

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()
    await app.init()

    jwt = moduleRef.get(JwtService)
    prisma = moduleRef.get(PrismaService)
    accountFactory = new AccountFactory(prisma)
    interviewFactory = new InterviewFactory(prisma)

    // Create a user and generate token
    const user = await accountFactory.makePrismaAccount()
    userId = user.id.toString()
    accessToken = jwt.sign({ sub: userId })
  })

  afterAll(async () => {
    await app.close()
  })

  it('should download simple report as Word document', async () => {
    // Create a survey and interview data
    const surveyResponse = await request(app.getHttpServer())
      .post('/surveys')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Survey for Simple Report',
        location: 'Location 1',
        type: 'Type 1',
      })

    const surveyId = surveyResponse.body.surveyId

    // Create interview with answers
    // Criar question, option e answer para simple report
    // Create user for question factory
    const questionUser = await accountFactory.makePrismaAccount()

    const { QuestionFactory } = await import('test/factories/make-question')
    const { OptionAnswerFactory } = await import(
      'test/factories/make-option-answer'
    )
    const { AnswerQuestionFactory } = await import(
      'test/factories/make-answer-question'
    )

    const questionFactory = new QuestionFactory(prisma)
    const optionFactory = new OptionAnswerFactory(prisma)
    const answerFactory = new AnswerQuestionFactory(prisma)

    const question = await questionFactory.makePrismaQuestion({
      surveyId: new UniqueEntityID(surveyId),
      accountId: questionUser.id,
    })
    const option = await optionFactory.makePrismaOptionAnswer({
      questionId: question.id,
      accountId: questionUser.id,
    })

    const interviewSimple = await interviewFactory.makePrismaInterview({
      surveyId: new UniqueEntityID(surveyId),
      accountId: new UniqueEntityID(userId),
    })
    await answerFactory.makePrismaAnswerQuestion({
      interviewId: interviewSimple.id,
      questionId: question.id,
      optionAnswerId: option.id,
      accountId: questionUser.id,
    })

    const response = await request(app.getHttpServer())
      .get(`/reports/simple/${surveyId}/download`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      )
      .expect(
        'Content-Disposition',
        /attachment; filename="relatorio-simples.*/,
      )
      .expect(200)

    expect(response.body).toBeDefined()
  })

  it('should download cross tabulation report as Word document', async () => {
    // Create a survey and interview data
    const surveyResponse = await request(app.getHttpServer())
      .post('/surveys')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Survey for Cross Tabulation Report',
        location: 'Location 2',
        type: 'Type 2',
      })

    const surveyId = surveyResponse.body.surveyId


    // Criar 2+ questions, options e answers para cross report (min 2 questions)
    // Create user for question factory
    const questionUser = await accountFactory.makePrismaAccount()

    const { QuestionFactory } = await import('test/factories/make-question')
    const { OptionAnswerFactory } = await import(
      'test/factories/make-option-answer'
    )
    const { AnswerQuestionFactory } = await import(
      'test/factories/make-answer-question'
    )

    const questionFactory = new QuestionFactory(prisma)
    const optionFactory = new OptionAnswerFactory(prisma)
    const answerFactory = new AnswerQuestionFactory(prisma)

    const question1 = await questionFactory.makePrismaQuestion({
      surveyId: new UniqueEntityID(surveyId),
      accountId: questionUser.id,
    })
    const question2 = await questionFactory.makePrismaQuestion({
      surveyId: new UniqueEntityID(surveyId),
      accountId: questionUser.id,
    })
    const option1 = await optionFactory.makePrismaOptionAnswer({
      questionId: question1.id,
      accountId: questionUser.id,
    })
    const option2 = await optionFactory.makePrismaOptionAnswer({
      questionId: question2.id,
      accountId: questionUser.id,
    })

    const interviewCrossFinal = await interviewFactory.makePrismaInterview({
      surveyId: new UniqueEntityID(surveyId),
      accountId: new UniqueEntityID(userId),
    })
    await answerFactory.makePrismaAnswerQuestion({
      interviewId: interviewCrossFinal.id,
      questionId: question1.id,
      optionAnswerId: option1.id,
      accountId: questionUser.id,
    })
    await answerFactory.makePrismaAnswerQuestion({
      interviewId: interviewCrossFinal.id,
      questionId: question2.id,
      optionAnswerId: option2.id,
      accountId: questionUser.id,
    })

    const response = await request(app.getHttpServer())
      .get(`/reports/cross/${surveyId}/download`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      )
      .expect(
        'Content-Disposition',
        /attachment; filename="relatorio-cruzado.*/,
      )
      .expect(200)

    expect(response.body).toBeDefined()
  })
})
