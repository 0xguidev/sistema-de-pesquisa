import { Injectable } from '@nestjs/common'
import { InterviewRepository } from '@/domain/repositories/interview-repository'
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  AlignmentType,
  BorderStyle,
  ShadingType,
  VerticalAlign,
  WidthType,
} from 'docx'

@Injectable()
export class GenerateSimpleReportWordUseCase {
  constructor(private interviewRepository: InterviewRepository) {}

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

    // FIX 1: Montar mapa de metadados das perguntas em uma única passagem (evita O(n²))
    const questionMeta: Map<string, { title: string; number: number }> =
      new Map()

    const report: Record<
      string,
      Record<
        string,
        { answer: string; count: number; percentage: number; num: number }
      >
    > = {}

    for (const interview of interviews.data) {
      for (const answer of interview.answers) {
        if (answer && answer.question.questionId && answer.option.title) {
          const questionId = answer.question.questionId

          // Armazena metadados da pergunta na primeira ocorrência
          if (!questionMeta.has(questionId)) {
            questionMeta.set(questionId, {
              title: answer.question.title,
              number: answer.question.number,
            })
          }

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

    // FIX 2: Calcular percentuais centralizadamente e armazenar no report
    for (const questionId in report) {
      for (const answerText in report[questionId]) {
        const entry = report[questionId][answerText]
        entry.percentage = parseFloat(
          ((entry.count / totalVotes) * 100).toFixed(1),
        )
      }
    }

    // FIX 3: Bordas usando BorderStyle enum
    const cellBorder = {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'D3D3D3' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D3D3D3' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'D3D3D3' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'D3D3D3' },
    }

    // FIX 4: margins como números simples (não objetos aninhados)
    const cellMargins = {
      top: 100,
      bottom: 100,
      left: 120,
      right: 120,
    }

    // Construir children do documento
    const children: (Paragraph | Table)[] = [
      new Paragraph({
        children: [
          new TextRun({
            text: 'Relatório Simples da Pesquisa',
            bold: true,
            size: 32,
            font: 'Calibri',
          }),
        ],
        alignment: AlignmentType.CENTER,
      }),
    ]

    for (const questionId in report) {
      const options = Object.values(report[questionId])
      options.sort((a, b) => a.num - b.num)

      // FIX 5: Usar o mapa de metadados em vez de flatMap (O(1) em vez de O(n))
      const meta = questionMeta.get(questionId)
      const questionText = meta?.title ?? 'N/A'
      const questionNum = meta?.number ?? 0

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${questionNum}. ${questionText}`,
              bold: true,
              size: 26,
              font: 'Calibri',
            }),
          ],
        }),
        new Table({
          width: {
            size: 9360,
            type: WidthType.DXA,
          },
          // columnWidths deve somar ao width da tabela (9360 DXA)
          columnWidths: [576, 8208, 576],
          rows: [
            // Linha de cabeçalho
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 576, type: WidthType.DXA },
                  margins: cellMargins,
                  borders: cellBorder,
                  // FIX 6: VerticalAlign enum em vez de string literal
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: 'Nº',
                          bold: true,
                          color: 'FFFFFF',
                          size: 22,
                          font: 'Calibri',
                        }),
                      ],
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                  // FIX 7: ShadingType.CLEAR em vez de SOLID para evitar fundo preto
                  shading: { type: ShadingType.CLEAR, fill: '4472C4' },
                }),
                new TableCell({
                  width: { size: 8208, type: WidthType.DXA },
                  margins: cellMargins,
                  borders: cellBorder,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: 'Opção',
                          bold: true,
                          color: 'FFFFFF',
                          size: 22,
                          font: 'Calibri',
                        }),
                      ],
                    }),
                  ],
                  shading: { type: ShadingType.CLEAR, fill: '4472C4' },
                }),
                new TableCell({
                  width: { size: 576, type: WidthType.DXA },
                  margins: cellMargins,
                  borders: cellBorder,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: '%',
                          bold: true,
                          color: 'FFFFFF',
                          size: 22,
                          font: 'Calibri',
                        }),
                      ],
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                  shading: { type: ShadingType.CLEAR, fill: '4472C4' },
                }),
              ],
            }),
            // Linhas de dados
            ...options.map((option, index) => {
              const rowFill = index % 2 === 0 ? 'F8F9FA' : 'FFFFFF'
              return new TableRow({
                children: [
                  new TableCell({
                    width: { size: 576, type: WidthType.DXA },
                    margins: cellMargins,
                    borders: cellBorder,
                    verticalAlign: VerticalAlign.CENTER,
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `${option.num}`,
                            size: 20,
                            font: 'Calibri',
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                    shading: { type: ShadingType.CLEAR, fill: rowFill },
                  }),
                  new TableCell({
                    width: { size: 8208, type: WidthType.DXA },
                    margins: cellMargins,
                    borders: cellBorder,
                    verticalAlign: VerticalAlign.CENTER,
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: option.answer,
                            size: 20,
                            font: 'Calibri',
                          }),
                        ],
                      }),
                    ],
                    shading: { type: ShadingType.CLEAR, fill: rowFill },
                  }),
                  new TableCell({
                    width: { size: 576, type: WidthType.DXA },
                    margins: cellMargins,
                    borders: cellBorder,
                    verticalAlign: VerticalAlign.CENTER,
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            // FIX 8: Usar o percentage já calculado no report
                            text: `${option.percentage.toFixed(2)}%`,
                            size: 20,
                            font: 'Calibri',
                            italics: true,
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                    shading: { type: ShadingType.CLEAR, fill: rowFill },
                  }),
                ],
              })
            }),
          ],
        }),
        new Paragraph({ children: [new TextRun('')] }),
      )
    }

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              size: {
                width: 11906,
                height: 16838,
              },
              margin: {
                top: 1440,
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
            },
          },
          children,
        },
      ],
    })

    const buffer = await Packer.toBuffer(doc)
    return buffer
  }
}
