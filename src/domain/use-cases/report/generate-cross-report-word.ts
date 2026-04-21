import { Injectable } from '@nestjs/common'
import { InterviewRepository } from '@/domain/repositories/interview-repository'
import { QuestionRepository } from '@/domain/repositories/question-repository'
import { OptionAnswerRepository } from '@/domain/repositories/option-answer-repository'
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  AlignmentType,
  ShadingType,
} from 'docx'

@Injectable()
export class GenerateCrossReportWordUseCase {
  constructor(
    private interviewRepository: InterviewRepository,
    private questionRepository: QuestionRepository,
    private optionAnswerRepository: OptionAnswerRepository,
  ) {}

  async execute(surveyId: string, accountId: string): Promise<Buffer> {
    const interviews = await this.interviewRepository.findBySurveyId(
      surveyId,
      accountId,
      1,
      1000,
    )
    if (!interviews || interviews.data.length === 0) {
      throw new Error('Nenhuma entrevista encontrada para gerar relatório')
    }

    // Buscar todas as perguntas do survey
    const questions =
      await this.questionRepository.findQuestionsBySurveyId(surveyId)
    if (!questions || questions.length < 2) {
      throw new Error(
        'São necessárias pelo menos duas perguntas para gerar relatório cruzado',
      )
    }

    const result: Array<{
      questionA: string
      questionANum: number
      questionAId: string
      questionB: string
      questionBNum: number
      questionBId: string
      answers: Array<{
        answerA: string
        answerB: string
        count: number
        percentage: number
        numA: number
        numB: number
      }>
    }> = []

    // Gerar pares de perguntas e suas combinações de opções
    for (let i = 0; i < questions.length; i++) {
      for (let j = i + 1; j < questions.length; j++) {
        const questionA = questions[i]
        const questionB = questions[j]

        const optionsA = await this.optionAnswerRepository.findManyByQuestionId(
          questionA.id.toString(),
        )
        const optionsB = await this.optionAnswerRepository.findManyByQuestionId(
          questionB.id.toString(),
        )

        if (
          !optionsA ||
          !optionsB ||
          optionsA.length === 0 ||
          optionsB.length === 0
        ) {
          continue // Pular se alguma pergunta não tem opções
        }

        const entry: {
          questionA: string
          questionANum: number
          questionAId: string
          questionB: string
          questionBNum: number
          questionBId: string
          answers: Array<{
            answerA: string
            answerB: string
            count: number
            percentage: number
            numA: number
            numB: number
          }>
        } = {
          questionA: questionA.questionTitle,
          questionANum: questionA.questionNum,
          questionAId: questionA.id.toString(),
          questionB: questionB.questionTitle,
          questionBNum: questionB.questionNum,
          questionBId: questionB.id.toString(),
          answers: [],
        }

        // Gerar todas as combinações cartesianas de opções
        for (const optionA of optionsA) {
          for (const optionB of optionsB) {
            entry.answers.push({
              answerA: optionA.optionTitle,
              answerB: optionB.optionTitle,
              count: 0,
              percentage: 0,
              numA: optionA.optionNum,
              numB: optionB.optionNum,
            })
          }
        }

        result.push(entry)
      }
    }

    // Contar ocorrências nas entrevistas
    for (const interview of interviews.data) {
      for (const entry of result) {
        const answerA = interview.answers.find(
          (a) => a.question.questionId === entry.questionAId,
        )
        const answerB = interview.answers.find(
          (a) => a.question.questionId === entry.questionBId,
        )

        if (answerA && answerB) {
          const answerEntry = entry.answers.find(
            (a) =>
              a.numA === answerA.option.number &&
              a.numB === answerB.option.number,
          )
          if (answerEntry) {
            answerEntry.count++
          }
        }
      }
    }

    // Calcular porcentagens e ordenar as respostas dentro de cada entrada
    for (const entry of result) {
      const totalVotes = interviews.data.length

      // Ordenar por numA e numB
      entry.answers.sort((a, b) => {
        if (a.numA !== b.numA) return a.numA - b.numA
        return a.numB - b.numB
      })

      for (const a of entry.answers) {
        a.percentage = parseFloat(((a.count / totalVotes) * 100).toFixed(1))
      }
    }

    // Construir children do documento
    const children: (Paragraph | Table)[] = [
      new Paragraph({
        children: [
          new TextRun({
            text: 'Relatório Cruzado da Pesquisa',
            bold: true,
            size: 32,
          }),
        ],
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Total de entrevistas: ${interviews.data.length}`,
            size: 24,
          }),
        ],
      }),
      new Paragraph({ children: [new TextRun('')] }), // Espaço
    ]

    for (const entry of result) {
      // Create a map for quick lookup
      const percentageMap: Record<string, number> = {}
      entry.answers.forEach((answer) => {
        percentageMap[`${answer.numA}-${answer.numB}`] = answer.percentage
      })

      // Get unique numA and numB, sorted
      const uniqueNumA = Array.from(
        new Set(entry.answers.map((a) => a.numA)),
      ).sort((a, b) => a - b)
      const uniqueNumB = Array.from(
        new Set(entry.answers.map((a) => a.numB)),
      ).sort((a, b) => a - b)

      // Get the answer texts for headers
      const numATexts: Record<number, string> = {}
      const numBTexts: Record<number, string> = {}
      entry.answers.forEach((answer) => {
        numATexts[answer.numA] = answer.answerA
        numBTexts[answer.numB] = answer.answerB
      })

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${entry.questionANum}. ${entry.questionA} vs ${entry.questionBNum}. ${entry.questionB}`,
              bold: true,
              size: 26,
            }),
          ],
        }),
        new Table({
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: 'Opções B / Opções A',
                          bold: true,
                          color: 'FFFFFF',
                        }),
                      ],
                    }),
                  ],
                  shading: { type: ShadingType.SOLID, color: '4A90E2' },
                }),
                ...uniqueNumA.map(
                  (numA) =>
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: numATexts[numA],
                              bold: true,
                              color: 'FFFFFF',
                            }),
                          ],
                        }),
                      ],
                      shading: { type: ShadingType.SOLID, color: '4A90E2' },
                    }),
                ),
              ],
            }),
            ...uniqueNumB.map(
              (numB, rowIndex) =>
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: numBTexts[numB], bold: true }),
                          ],
                        }),
                      ],
                      shading: {
                        type: ShadingType.SOLID,
                        color: rowIndex % 2 === 0 ? 'F0F0F0' : 'FFFFFF',
                      },
                    }),
                    ...uniqueNumA.map((numA) => {
                      const percentage = percentageMap[`${numA}-${numB}`] || 0
                      return new TableCell({
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: percentage.toFixed(2) + '%',
                              }),
                            ],
                            alignment: AlignmentType.CENTER,
                          }),
                        ],
                        shading: { type: ShadingType.SOLID, color: 'FFFFFF' },
                      })
                    }),
                  ],
                }),
            ),
          ],
        }),
        new Paragraph({ children: [new TextRun('')] }), // Espaço
      )
    }

    // Criar documento Word
    const doc = new Document({
      sections: [
        {
          properties: {},
          children,
        },
      ],
    })

    // Gerar buffer do documento
    const buffer = await Packer.toBuffer(doc)
    return buffer
  }
}
