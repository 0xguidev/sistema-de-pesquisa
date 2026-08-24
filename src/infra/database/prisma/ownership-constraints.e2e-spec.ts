import { PrismaClient } from '@prisma/client'

describe('database ownership constraints', () => {
  const prisma = new PrismaClient()
  const owner = '00000000-0000-4000-8000-000000000001'
  const other = '00000000-0000-4000-8000-000000000002'
  const survey1 = '10000000-0000-4000-8000-000000000001'
  const survey2 = '10000000-0000-4000-8000-000000000002'
  const question1 = '20000000-0000-4000-8000-000000000001'
  const question2 = '20000000-0000-4000-8000-000000000002'
  const option1 = '30000000-0000-4000-8000-000000000001'
  const option2 = '30000000-0000-4000-8000-000000000002'
  const interview1 = '40000000-0000-4000-8000-000000000001'

  beforeAll(async () => {
    await prisma.user.createMany({
      data: [
        {
          id: owner,
          email: 'constraints-owner@example.com',
          password: 'hash',
          name: 'Owner',
          slug: 'constraints-owner',
        },
        {
          id: other,
          email: 'constraints-other@example.com',
          password: 'hash',
          name: 'Other',
          slug: 'constraints-other',
        },
      ],
    })
    await prisma.survey.createMany({
      data: [
        {
          id: survey1,
          title: 'Survey 1',
          location: 'A',
          type: 'test',
          slug: 'constraints-survey-1',
          userId: owner,
        },
        {
          id: survey2,
          title: 'Survey 2',
          location: 'B',
          type: 'test',
          slug: 'constraints-survey-2',
          userId: owner,
        },
      ],
    })
    await prisma.question.createMany({
      data: [
        {
          id: question1,
          title: 'Question 1',
          number: 1,
          slug: 'constraints-question-1',
          surveyId: survey1,
          userId: owner,
        },
        {
          id: question2,
          title: 'Question 2',
          number: 1,
          slug: 'constraints-question-2',
          surveyId: survey2,
          userId: owner,
        },
      ],
    })
    await prisma.optionAnswer.createMany({
      data: [
        {
          id: option1,
          option: 'Option 1',
          number: 1,
          slug: 'constraints-option-1',
          questionId: question1,
          userId: owner,
        },
        {
          id: option2,
          option: 'Option 2',
          number: 1,
          slug: 'constraints-option-2',
          questionId: question2,
          userId: owner,
        },
      ],
    })
    await prisma.interview.create({
      data: { id: interview1, surveyId: survey1, userId: owner },
    })
    await prisma.answerQuestion.create({
      data: {
        id: '50000000-0000-4000-8000-000000000001',
        interviewId: interview1,
        surveyId: survey1,
        questionId: question1,
        optionAnswerId: option1,
        userId: owner,
      },
    })
  })

  afterAll(() => prisma.$disconnect())

  it('rejects a question owned by someone other than its survey', async () => {
    await expect(
      prisma.question.create({
        data: {
          title: 'Invalid',
          number: 9,
          slug: 'invalid-question-owner',
          surveyId: survey1,
          userId: other,
        },
      }),
    ).rejects.toThrow()
  })

  it('rejects an option owned by someone other than its question', async () => {
    await expect(
      prisma.optionAnswer.create({
        data: {
          option: 'Invalid',
          number: 9,
          slug: 'invalid-option-owner',
          questionId: question1,
          userId: other,
        },
      }),
    ).rejects.toThrow()
  })

  it('rejects an interview owned by someone other than its survey', async () => {
    await expect(
      prisma.interview.create({
        data: { surveyId: survey1, userId: other },
      }),
    ).rejects.toThrow()
  })

  it.each([
    {
      name: 'answer owned by someone other than its interview',
      surveyId: survey1,
      questionId: question1,
      optionAnswerId: option1,
      userId: other,
    },
    {
      name: 'option that belongs to another question',
      surveyId: survey1,
      questionId: question1,
      optionAnswerId: option2,
      userId: owner,
    },
    {
      name: 'question outside the interview survey',
      surveyId: survey1,
      questionId: question2,
      optionAnswerId: option2,
      userId: owner,
    },
  ])('rejects $name', async ({ name: _name, ...data }) => {
    await expect(
      prisma.answerQuestion.create({
        data: { ...data, interviewId: interview1 },
      }),
    ).rejects.toThrow()
  })

  it('rejects a second answer for the same interview and question', async () => {
    await expect(
      prisma.answerQuestion.create({
        data: {
          interviewId: interview1,
          surveyId: survey1,
          questionId: question1,
          optionAnswerId: option1,
          userId: owner,
        },
      }),
    ).rejects.toThrow()
  })
})
