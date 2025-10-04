import { Injectable } from '@nestjs/common'
import { InterviewRepository } from 'src/domain/repositories/interview-repository'
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, AlignmentType } from 'docx'

@Injectable()
export class GenerateCrossTabulationWordUseCase {
  constructor(private interviewRepository: InterviewRepository) {}

  async execute(surveyId: string, accountId: string): Promise<Buffer> {
    const interviews = await this.interviewRepository.findBySurveyId(surveyId, accountId, 1, 1000)
    if (!interviews || interviews.data.length === 0) {
      throw new Error('Nenhuma entrevista encontrada para gerar relatório')
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

    // Loop pelas entrevistas
    for (const interview of interviews.data) {
      for (let i = 0; i < interview.answers.length; i++) {
        const answerA = interview.answers[i]

        for (let j = i + 1; j < interview.answers.length; j++) {
          const answerB = interview.answers[j]

          if (
            answerA.question.questionId !== answerB.question.questionId &&
            answerA.question.number < answerB.question.number
          ) {
            const questionAId = answerA.question.questionId
            const questionA = answerA.question.title
            const questionANum = answerA.question.number
            const questionBId = answerB.question.questionId
            const questionB = answerB.question.title
            const questionBNum = answerB.question.number
            const answerTextA = answerA.option.title
            const answerTextB = answerB.option.title

            let entry = result.find(
              e =>
                e.questionAId === questionAId &&
                e.questionBId === questionBId,
            )
            if (!entry) {
              entry = {
                questionA,
                questionANum,
                questionAId,
                questionB,
                questionBNum,
                questionBId,
                answers: [],
              }
              result.push(entry)
            }

            let answerEntry = entry.answers.find(
              a => a.answerA === answerTextA && a.answerB === answerTextB,
            )
            if (!answerEntry) {
              answerEntry = {
                answerA: answerTextA,
                answerB: answerTextB,
                count: 0,
                percentage: 0,
                numA: answerA.option.number,
                numB: answerB.option.number,
              }
              entry.answers.push(answerEntry)
            }
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
                  children: [new Paragraph({ children: [new TextRun({ text: 'Resposta A', bold: true })] })],
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: 'Resposta B', bold: true })] })],
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: 'Contagem', bold: true })] })],
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: 'Porcentagem', bold: true })] })],
                }),
              ],
            }),
            ...entry.answers.map(answer => new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun(answer.answerA)] })],
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun(answer.answerB)] })],
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun(answer.count.toString())] })],
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun(`${answer.percentage}%`)] })],
                }),
              ],
            })),
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
