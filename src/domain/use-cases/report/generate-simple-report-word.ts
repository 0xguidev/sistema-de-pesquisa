import { Injectable } from '@nestjs/common'
import { InterviewRepository } from 'src/domain/repositories/interview-repository'
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, AlignmentType } from 'docx'

@Injectable()
export class GenerateSimpleReportWordUseCase {
  constructor(private interviewRepository: InterviewRepository) {}

  async execute(surveyId: string, accountId: string): Promise<Buffer> {
    const interviews = await this.interviewRepository.findBySurveyId(surveyId, accountId, 1, 1000)
    if (!interviews || interviews.data.length === 0) {
      throw new Error('Nenhuma entrevista encontrada para gerar relatório')
    }

    const report: Record<string, Record<string, { answer: string; count: number; percentage: number; num: number }>> = {}

    for (const interview of interviews.data) {
      for (const answer of interview.answers) {
        if (answer && answer.question.questionId && answer.option.title) {
          const questionId = answer.question.questionId

          if (!report[questionId]) {
            report[questionId] = {}
          }

          const answerText = answer.option.title
          if (!report[questionId][answerText]) {
            report[questionId][answerText] = {
              answer: answerText,
              count: 0,
              percentage: 0,
              num: answer.option.number,
            }
          }

          report[questionId][answerText].count++
        }
      }
    }

    const totalVotes = interviews.data.length

    // Construir children do documento
    const children: (Paragraph | Table)[] = [
      new Paragraph({
        children: [
          new TextRun({
            text: 'Relatório Simples da Pesquisa',
            bold: true,
            size: 32,
          }),
        ],
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Total de entrevistas: ${totalVotes}`,
            size: 24,
          }),
        ],
      }),
      new Paragraph({ children: [new TextRun('')] }), // Espaço
    ]

    for (const questionId in report) {
      const options = Object.values(report[questionId])
      options.sort((a, b) => a.num - b.num)

      // Obter texto da pergunta
      const firstAnswer = interviews.data
        .flatMap(i => i.answers)
        .find(a => a.question.questionId === questionId)
      const questionText = firstAnswer?.question.title || 'N/A'
      const questionNum = firstAnswer?.question.number || 0

      // Adicionar pergunta
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${questionNum}. ${questionText}`,
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
                  children: [new Paragraph({ children: [new TextRun({ text: 'Opção', bold: true })] })],
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: 'Contagem', bold: true })] })],
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: 'Porcentagem', bold: true })] })],
                }),
              ],
            }),
            ...options.map(option => {
              const percentage = parseFloat(((option.count / totalVotes) * 100).toFixed(1))
              return new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun(option.answer)] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun(option.count.toString())] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun(`${percentage}%`)] })],
                  }),
                ],
              })
            }),
          ],
        }),
        new Paragraph({ children: [new TextRun('')] }), // Espaço
      )
    }

    // Criar documento Word
    const doc = new Document({
      sections: [{
        properties: {},
        children,
      }],
    })

    // Gerar buffer do documento
    const buffer = await Packer.toBuffer(doc)
    return buffer
  }
}
