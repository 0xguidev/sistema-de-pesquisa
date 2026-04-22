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
  BorderStyle,
  ShadingType,
  VerticalAlign,
  WidthType,
} from 'docx'

// ---------------------------------------------------------------------------
// Constantes de layout
// ---------------------------------------------------------------------------

/** Margens da página em DXA (1 inch = 1440 DXA) */
const PAGE_MARGIN = 1440

/**
 * Largura útil do conteúdo em A4 retrato (DXA).
 *   11906 - 2 × 1440 = 9026
 * Todas as tabelas usam esta largura fixa. O Word faz word-wrap
 * automaticamente dentro de cada célula quando o texto não cabe.
 */
const CONTENT_WIDTH = 11906 - PAGE_MARGIN * 2 // 9026 DXA

/**
 * Fração da largura total reservada para a coluna de rótulo (opções B).
 * O restante (75 %) é dividido igualmente entre as colunas de dados.
 */
const LABEL_COL_RATIO = 0.3

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

    const questions =
      await this.questionRepository.findQuestionsBySurveyId(surveyId)
    if (!questions || questions.length < 2) {
      throw new Error(
        'São necessárias pelo menos duas perguntas para gerar relatório cruzado',
      )
    }

    // -----------------------------------------------------------------------
    // Montar estrutura de resultados
    // -----------------------------------------------------------------------

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

        if (!optionsA?.length || !optionsB?.length) continue

        result.push({
          questionA: questionA.questionTitle,
          questionANum: questionA.questionNum,
          questionAId: questionA.id.toString(),
          questionB: questionB.questionTitle,
          questionBNum: questionB.questionNum,
          questionBId: questionB.id.toString(),
          answers: optionsA.flatMap((optA) =>
            optionsB.map((optB) => ({
              answerA: optA.optionTitle,
              answerB: optB.optionTitle,
              count: 0,
              percentage: 0,
              numA: optA.optionNum,
              numB: optB.optionNum,
            })),
          ),
        })
      }
    }

    // -----------------------------------------------------------------------
    // Contar ocorrências
    // -----------------------------------------------------------------------

    for (const interview of interviews.data) {
      for (const entry of result) {
        const answerA = interview.answers.find(
          (a) => a.question.questionId === entry.questionAId,
        )
        const answerB = interview.answers.find(
          (a) => a.question.questionId === entry.questionBId,
        )

        if (answerA && answerB) {
          const match = entry.answers.find(
            (a) =>
              a.numA === answerA.option.number &&
              a.numB === answerB.option.number,
          )
          if (match) match.count++
        }
      }
    }

    // -----------------------------------------------------------------------
    // Calcular percentuais e ordenar
    // -----------------------------------------------------------------------

    const totalVotes = interviews.data.length

    for (const entry of result) {
      entry.answers.sort((a, b) =>
        a.numA !== b.numA ? a.numA - b.numA : a.numB - b.numB,
      )
      for (const a of entry.answers) {
        a.percentage = parseFloat(((a.count / totalVotes) * 100).toFixed(1))
      }
    }

    // -----------------------------------------------------------------------
    // Helpers de estilo
    // -----------------------------------------------------------------------

    const cellBorder = {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'D3D3D3' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D3D3D3' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'D3D3D3' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'D3D3D3' },
    }

    const cellMargins = { top: 100, bottom: 100, left: 120, right: 120 }

    /**
     * Calcula os colWidths para uma tabela com `numDataCols` colunas de dados.
     *
     * A tabela sempre ocupa CONTENT_WIDTH no total. A coluna de rótulo recebe
     * LABEL_COL_RATIO do total; o restante é dividido igualmente entre as colunas
     * de dados. A última coluna de dados absorve o resíduo de arredondamento.
     *
     * Não há largura mínima: deixamos o Word fazer word-wrap nas células
     * estreitas em vez de estourar a margem.
     */
    const calcColWidths = (numDataCols: number): number[] => {
      const labelWidth = Math.floor(CONTENT_WIDTH * LABEL_COL_RATIO)
      const remaining = CONTENT_WIDTH - labelWidth
      const dataWidth = Math.floor(remaining / numDataCols)
      const lastDataWidth = remaining - dataWidth * (numDataCols - 1)

      return [
        labelWidth,
        ...Array(numDataCols - 1).fill(dataWidth),
        lastDataWidth,
      ]
    }

    /**
     * Célula de cabeçalho.
     * `width` é passado em DXA; o Word respeita o tamanho e quebra o texto
     * quando necessário graças ao `wordWrap` implícito do formato OOXML.
     */
    const buildHeaderCell = (text: string, width: number): TableCell =>
      new TableCell({
        width: { size: width, type: WidthType.DXA },
        margins: cellMargins,
        borders: cellBorder,
        verticalAlign: VerticalAlign.CENTER,
        shading: { type: ShadingType.CLEAR, fill: '4472C4' },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text,
                bold: true,
                color: 'FFFFFF',
                size: 18,
                font: 'Calibri',
              }),
            ],
          }),
        ],
      })

    /**
     * Célula de dado.
     * Sem nenhuma propriedade que desabilite quebra de linha — o Word
     * aplica word-wrap automaticamente quando o conteúdo excede a largura.
     */
    const buildDataCell = (
      text: string,
      width: number,
      fill: string,
      bold = false,
      center = false,
    ): TableCell =>
      new TableCell({
        width: { size: width, type: WidthType.DXA },
        margins: cellMargins,
        borders: cellBorder,
        verticalAlign: VerticalAlign.CENTER,
        shading: { type: ShadingType.CLEAR, fill },
        children: [
          new Paragraph({
            alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
            children: [
              new TextRun({
                text,
                bold,
                size: 18,
                font: 'Calibri',
                italics: !bold && center,
              }),
            ],
          }),
        ],
      })

    // -----------------------------------------------------------------------
    // Construir conteúdo do documento (seção única em retrato)
    // -----------------------------------------------------------------------

    const children: (Paragraph | Table)[] = [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: 'Relatório Cruzado da Pesquisa',
            bold: true,
            size: 32,
            font: 'Calibri',
          }),
        ],
      }),
      new Paragraph({ children: [new TextRun('')] }),
    ]

    for (const entry of result) {
      const uniqueNumA = Array.from(
        new Set(entry.answers.map((a) => a.numA)),
      ).sort((a, b) => a - b)

      const uniqueNumB = Array.from(
        new Set(entry.answers.map((a) => a.numB)),
      ).sort((a, b) => a - b)

      const numATexts: Record<number, string> = {}
      const numBTexts: Record<number, string> = {}
      const percentageMap: Record<string, number> = {}

      for (const answer of entry.answers) {
        numATexts[answer.numA] = answer.answerA
        numBTexts[answer.numB] = answer.answerB
        percentageMap[`${answer.numA}-${answer.numB}`] = answer.percentage
      }

      const colWidths = calcColWidths(uniqueNumA.length)
      const tableWidth = colWidths.reduce((s, w) => s + w, 0)

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${entry.questionANum}. ${entry.questionA}  ×  ${entry.questionBNum}. ${entry.questionB}`,
              bold: true,
              size: 22,
              font: 'Calibri',
            }),
          ],
        }),
        new Table({
          width: { size: tableWidth, type: WidthType.DXA },
          columnWidths: colWidths,
          rows: [
            // Linha de cabeçalho
            new TableRow({
              children: [
                buildHeaderCell('Opções B \\ Opções A', colWidths[0]),
                ...uniqueNumA.map((numA, idx) =>
                  buildHeaderCell(numATexts[numA], colWidths[idx + 1]),
                ),
              ],
            }),
            // Linhas de dados
            ...uniqueNumB.map(
              (numB, rowIndex) =>
                new TableRow({
                  children: [
                    buildDataCell(
                      numBTexts[numB],
                      colWidths[0],
                      rowIndex % 2 === 0 ? 'EBF0FA' : 'FFFFFF',
                      true,
                      false,
                    ),
                    ...uniqueNumA.map((numA, colIndex) =>
                      buildDataCell(
                        `${(percentageMap[`${numA}-${numB}`] ?? 0).toFixed(1)}%`,
                        colWidths[colIndex + 1],
                        rowIndex % 2 === 0 ? 'F8F9FA' : 'FFFFFF',
                        false,
                        true,
                      ),
                    ),
                  ],
                }),
            ),
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
              size: { width: 11906, height: 16838 },
              margin: {
                top: PAGE_MARGIN,
                right: PAGE_MARGIN,
                bottom: PAGE_MARGIN,
                left: PAGE_MARGIN,
              },
            },
          },
          children,
        },
      ],
    })

    return Packer.toBuffer(doc)
  }
}
