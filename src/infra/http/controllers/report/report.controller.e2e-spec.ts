import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '@/app.module'
import { SessionService } from '@/infra/auth/session.service'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { AccountFactory } from 'test/factories/make-Account'
import { InterviewFactory } from 'test/factories/make-interview'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { IncomingMessage } from 'node:http'
import JSZip from 'jszip'

function parseBinary(
  response: IncomingMessage,
  callback: (error: Error | null, body?: Buffer) => void,
) {
  const chunks: Buffer[] = []
  response.on('data', (chunk: Buffer) => chunks.push(chunk))
  response.on('end', () => callback(null, Buffer.concat(chunks)))
}

describe('Report Controllers (E2E)', () => {
  let app: INestApplication
  let sessions: SessionService
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

    sessions = moduleRef.get(SessionService)
    prisma = moduleRef.get(PrismaService)
    accountFactory = new AccountFactory(prisma)
    interviewFactory = new InterviewFactory(prisma)

    // Create a user and generate token
    const user = await accountFactory.makePrismaAccount()
    userId = user.id.toString()
    accessToken = (await sessions.create(userId, {})).accessToken
  })

  afterAll(async () => {
    await app.close()
  })

  it('hides report data and downloads from another account', async () => {
    const otherUser = await accountFactory.makePrismaAccount()
    const otherToken = (await sessions.create(otherUser.id.toString(), {}))
      .accessToken
    const survey = await prisma.survey.create({
      data: {
        title: 'Confidential résumé',
        location: 'Private',
        type: 'Private',
        slug: `private-${Date.now()}`,
        userId,
      },
    })

    for (const path of [
      `/reports/simple/${survey.id}`,
      `/reports/cross/${survey.id}`,
      `/reports/simple/${survey.id}/download`,
      `/reports/cross/${survey.id}/download`,
      `/reports/simple-pdf/${survey.id}`,
    ]) {
      await request(app.getHttpServer())
        .get(path)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(404)
    }
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
    const { QuestionFactory } = await import('test/factories/make-question')
    const { OptionAnswerFactory } =
      await import('test/factories/make-option-answer')
    const { AnswerQuestionFactory } =
      await import('test/factories/make-answer-question')

    const questionFactory = new QuestionFactory(prisma)
    const optionFactory = new OptionAnswerFactory(prisma)
    const answerFactory = new AnswerQuestionFactory(prisma)

    const question = await questionFactory.makePrismaQuestion({
      surveyId: new UniqueEntityID(surveyId),
      accountId: new UniqueEntityID(userId),
      questionTitle: '<b>Preferred option</b>',
      questionNum: 1,
    })
    const option = await optionFactory.makePrismaOptionAnswer({
      questionId: question.id,
      accountId: new UniqueEntityID(userId),
      optionTitle: 'Deterministic blue',
      optionNum: 1,
    })

    const interviewSimple = await interviewFactory.makePrismaInterview({
      surveyId: new UniqueEntityID(surveyId),
      accountId: new UniqueEntityID(userId),
    })
    await answerFactory.makePrismaAnswerQuestion({
      interviewId: interviewSimple.id,
      questionId: question.id,
      optionAnswerId: option.id,
      accountId: new UniqueEntityID(userId),
    })

    const outsider = await accountFactory.makePrismaAccount({
      email: 'docx-simple-outsider@example.com',
    })
    const outsiderQuestion = await questionFactory.makePrismaQuestion({
      surveyId: new UniqueEntityID(surveyId),
      accountId: outsider.id,
      questionTitle: 'OUTSIDER SECRET',
      questionNum: 99,
    })
    const outsiderOption = await optionFactory.makePrismaOptionAnswer({
      questionId: outsiderQuestion.id,
      accountId: outsider.id,
      optionTitle: 'OUTSIDER OPTION',
      optionNum: 1,
    })
    const outsiderInterview = await interviewFactory.makePrismaInterview({
      surveyId: new UniqueEntityID(surveyId),
      accountId: outsider.id,
    })
    await answerFactory.makePrismaAnswerQuestion({
      interviewId: outsiderInterview.id,
      questionId: outsiderQuestion.id,
      optionAnswerId: outsiderOption.id,
      accountId: outsider.id,
    })

    const response = await request(app.getHttpServer())
      .get(`/reports/simple/${surveyId}/download`)
      .set('Authorization', `Bearer ${accessToken}`)
      .buffer(true)
      .parse(parseBinary)
      .expect(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      )
      .expect(
        'Content-Disposition',
        /attachment; filename="relatorio-simples.*/,
      )
      .expect(200)

    expect(Buffer.isBuffer(response.body)).toBe(true)
    expect(response.body.length).toBeGreaterThan(1_000)
    expect(response.body.subarray(0, 2).toString()).toBe('PK')
    const documentXml = await readDocumentXml(response.body)
    expect(documentXml).toContain('Relatório Simples da Pesquisa')
    expect(documentXml).toContain('&lt;b&gt;Preferred option&lt;/b&gt;')
    expect(documentXml).toContain('Deterministic blue')
    expect(documentXml).toContain('100.00%')
    expect(documentXml).not.toContain('<b>Preferred option</b>')
    expect(documentXml).not.toContain('OUTSIDER SECRET')
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
    const { QuestionFactory } = await import('test/factories/make-question')
    const { OptionAnswerFactory } =
      await import('test/factories/make-option-answer')
    const { AnswerQuestionFactory } =
      await import('test/factories/make-answer-question')

    const questionFactory = new QuestionFactory(prisma)
    const optionFactory = new OptionAnswerFactory(prisma)
    const answerFactory = new AnswerQuestionFactory(prisma)

    const question1 = await questionFactory.makePrismaQuestion({
      surveyId: new UniqueEntityID(surveyId),
      accountId: new UniqueEntityID(userId),
      questionTitle: 'Deterministic age',
      questionNum: 1,
    })
    const question2 = await questionFactory.makePrismaQuestion({
      surveyId: new UniqueEntityID(surveyId),
      accountId: new UniqueEntityID(userId),
      questionTitle: 'Deterministic candidate',
      questionNum: 2,
    })
    const option1 = await optionFactory.makePrismaOptionAnswer({
      questionId: question1.id,
      accountId: new UniqueEntityID(userId),
      optionTitle: 'Age 18-29',
      optionNum: 1,
    })
    const option2 = await optionFactory.makePrismaOptionAnswer({
      questionId: question2.id,
      accountId: new UniqueEntityID(userId),
      optionTitle: 'Candidate A',
      optionNum: 1,
    })

    const interviewCrossFinal = await interviewFactory.makePrismaInterview({
      surveyId: new UniqueEntityID(surveyId),
      accountId: new UniqueEntityID(userId),
    })
    await answerFactory.makePrismaAnswerQuestion({
      interviewId: interviewCrossFinal.id,
      questionId: question1.id,
      optionAnswerId: option1.id,
      accountId: new UniqueEntityID(userId),
    })

    const outsider = await accountFactory.makePrismaAccount({
      email: 'docx-cross-outsider@example.com',
    })
    const outsiderQuestion = await questionFactory.makePrismaQuestion({
      surveyId: new UniqueEntityID(surveyId),
      accountId: outsider.id,
      questionTitle: 'OUTSIDER SECRET',
      questionNum: 99,
    })
    await optionFactory.makePrismaOptionAnswer({
      questionId: outsiderQuestion.id,
      accountId: outsider.id,
      optionTitle: 'OUTSIDER OPTION',
      optionNum: 1,
    })
    await answerFactory.makePrismaAnswerQuestion({
      interviewId: interviewCrossFinal.id,
      questionId: question2.id,
      optionAnswerId: option2.id,
      accountId: new UniqueEntityID(userId),
    })

    const response = await request(app.getHttpServer())
      .get(`/reports/cross/${surveyId}/download`)
      .set('Authorization', `Bearer ${accessToken}`)
      .buffer(true)
      .parse(parseBinary)
      .expect(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      )
      .expect(
        'Content-Disposition',
        /attachment; filename="relatorio-cruzado.*/,
      )
      .expect(200)

    expect(Buffer.isBuffer(response.body)).toBe(true)
    expect(response.body.length).toBeGreaterThan(1_000)
    expect(response.body.subarray(0, 2).toString()).toBe('PK')
    const documentXml = await readDocumentXml(response.body)
    expect(documentXml).toContain('Relatório Cruzado da Pesquisa')
    expect(documentXml).toContain('Deterministic age')
    expect(documentXml).toContain('Deterministic candidate')
    expect(documentXml).toContain('Age 18-29')
    expect(documentXml).toContain('Candidate A')
    expect(documentXml).toContain('100.0%')
    expect(documentXml).not.toContain('OUTSIDER SECRET')
  })
})

async function readDocumentXml(document: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(document)
  const entry = zip.file('word/document.xml')
  if (!entry) throw new Error('DOCX does not contain word/document.xml')
  return entry.async('string')
}
