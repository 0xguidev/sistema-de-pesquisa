type Option = {
  num: number
  answer: string
  percentage: number
  count: number
}

type Question = {
  questionNum: number
  questionTitle: string
  options: Option[]
}

export function buildHtml(questions: Question[]) {
  const escapeHtml = (value: unknown) =>
    String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;')

  const safeNumber = (value: unknown) => {
    const number = Number(value)

    return Number.isFinite(number) ? number : 0
  }

  const safePercentage = (value: unknown) =>
    Math.min(100, Math.max(0, safeNumber(value)))

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'none'; style-src 'unsafe-inline'; img-src data:"
    />
    <style>
      * {
        box-sizing: border-box;
      }

      @page {
        size: A4;
        margin: 18mm 14mm;
      }

      body {
        margin: 0;
        font-family: Arial, Helvetica, sans-serif;
        color: #172033;
        background: #fff;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .report-header {
        padding: 4px 2px 22px;
        margin-bottom: 24px;
        border-bottom: 3px solid #2563eb;
      }

      .report-kicker {
        margin: 0 0 7px;
        color: #2563eb;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 1.5px;
        text-transform: uppercase;
      }

      h1 {
        margin: 0;
        font-size: 28px;
        line-height: 1.15;
        letter-spacing: -0.5px;
      }

      .report-summary {
        margin: 8px 0 0;
        color: #64748b;
        font-size: 13px;
      }

      .question {
        margin-bottom: 26px;
        padding: 22px;
        border: 1px solid #dbe3ef;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
        page-break-inside: avoid;
        break-inside: avoid;
      }

      .question-heading {
        display: flex;
        gap: 12px;
        align-items: flex-start;
        margin-bottom: 22px;
      }

      .question-number {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        flex: 0 0 32px;
        color: #fff;
        background: #2563eb;
        border-radius: 9px;
        font-size: 14px;
        font-weight: 700;
      }

      .question-title {
        padding-top: 4px;
        font-size: 17px;
        font-weight: 700;
        line-height: 1.4;
      }

      .chart-wrap {
        display: grid;
        grid-template-columns: 30px 1fr;
        gap: 8px;
        margin-bottom: 22px;
      }

      .chart-scale {
        height: 194px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding-bottom: 24px;
        color: #94a3b8;
        font-size: 9px;
        text-align: right;
      }

      .chart {
        display: flex;
        gap: 10px;
        height: 194px;
        padding: 0 10px;
        background: repeating-linear-gradient(
          to bottom,
          #e8edf5 0,
          #e8edf5 1px,
          transparent 1px,
          transparent 42.5px
        );
        border-bottom: 1px solid #cbd5e1;
      }

      .chart-column {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: center;
      }

      .chart-value {
        margin-bottom: 6px;
        color: #334155;
        font-size: 11px;
        font-weight: 700;
      }

      .chart-bar-area {
        width: min(64px, 78%);
        height: 170px;
        display: flex;
        align-items: flex-end;
      }

      .chart-bar {
        width: 100%;
        min-height: 2px;
        background: linear-gradient(180deg, #3b82f6, #2563eb);
        border-radius: 5px 5px 0 0;
      }

      .chart-column:nth-child(4n + 2) .chart-bar {
        background: linear-gradient(180deg, #22c55e, #16a34a);
      }

      .chart-column:nth-child(4n + 3) .chart-bar {
        background: linear-gradient(180deg, #f59e0b, #d97706);
      }

      .chart-column:nth-child(4n + 4) .chart-bar {
        background: linear-gradient(180deg, #a855f7, #9333ea);
      }

      .chart-label {
        height: 24px;
        padding-top: 6px;
        font-size: 13px;
        color: #475569;
        font-weight: 700;
      }

      .options-heading {
        margin: 0 0 10px;
        color: #64748b;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 1px;
        text-transform: uppercase;
      }

      .options-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .options-list li {
        min-height: 34px;
        padding: 8px 10px;
        color: #334155;
        background: #f8fafc;
        border-radius: 6px;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .option-num {
        font-weight: bold;
        color: #2563eb;
        min-width: 18px;
        text-align: center;
        flex-shrink: 0;
      }

      .option-separator {
        color: #aaa;
        flex-shrink: 0;
      }

      .option-text {
        flex: 1;
      }

      .option-stats {
        min-width: 92px;
        color: #64748b;
        font-size: 11px;
        text-align: right;
        flex-shrink: 0;
      }
    </style>
  </head>

  <body>
    <header class="report-header">
      <p class="report-kicker">Resultados consolidados</p>
      <h1>Relatório da Pesquisa</h1>
      <p class="report-summary">
        ${escapeHtml(questions.length)} ${questions.length === 1 ? 'pergunta analisada' : 'perguntas analisadas'}
      </p>
    </header>

    ${questions
      .map((q, index) => {
        const sortedOptions = [...q.options].sort((a, b) => a.num - b.num)

        const chartRows = sortedOptions
          .map((o) => {
            const optionNumber = safeNumber(o.num)
            const percentage = safePercentage(o.percentage)

            return `
            <div class="chart-column">
              <span class="chart-value">${escapeHtml(percentage)}%</span>
              <div class="chart-bar-area">
                <div class="chart-bar" style="height: ${percentage}%"></div>
              </div>
              <span class="chart-label">${escapeHtml(optionNumber)}</span>
            </div>
          `
          })
          .join('')

        const listItems = sortedOptions
          .map((o) => {
            const optionNumber = safeNumber(o.num)
            const percentage = safePercentage(o.percentage)

            return `
            <li>
              <span class="option-num">${escapeHtml(optionNumber)}.</span>
              <span class="option-separator">—</span>
              <span class="option-text">${escapeHtml(o.answer)}</span>
              <span class="option-stats">${escapeHtml(percentage)}%</span>
            </li>
          `
          })
          .join('')

        return `
        <div class="question">
          <div class="question-heading">
            <span class="question-number">${escapeHtml(safeNumber(q.questionNum))}</span>
            <div class="question-title">${escapeHtml(q.questionTitle)}</div>
          </div>
          <div class="chart-wrap">
            <div class="chart-scale" aria-hidden="true">
              <span>100%</span>
              <span>75%</span>
              <span>50%</span>
              <span>25%</span>
              <span>0%</span>
            </div>
            <div class="chart" aria-label="Gráfico da pergunta ${index + 1}">
              ${chartRows}
            </div>
          </div>

          <p class="options-heading">Detalhamento das respostas</p>
          <ul class="options-list">
            ${listItems}
          </ul>
        </div>

      `
      })
      .join('')}
  </body>
  </html>
  `
}
