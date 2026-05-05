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
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <style>
      body {
        font-family: Arial, sans-serif;
        padding: 40px;
        color: #333;
      }

      h1 {
        text-align: center;
        margin-bottom: 40px;
      }

      .question {
        margin-bottom: 60px;
        page-break-inside: avoid;
      }

      .question-title {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 20px;
      }

      canvas {
        max-width: 100%;
      }

      .options-list {
        list-style: none;
        padding: 0;
        margin-top: 16px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .options-list li {
        font-size: 13px;
        color: #444;
        display: flex;
        align-items: baseline;
        gap: 8px;
      }

      .option-num {
        font-weight: bold;
        color: #1a73e8;
        min-width: 24px;
        text-align: right;
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
        color: #888;
        font-size: 12px;
        flex-shrink: 0;
      }
    </style>
  </head>

  <body>
    <h1>Relatório da Pesquisa</h1>

    ${questions
      .map((q, index) => {
        const sortedOptions = [...q.options].sort((a, b) => a.num - b.num)

        const listItems = sortedOptions
          .map(
            (o) => `
            <li>
              <span class="option-num">${o.num}.</span>
              <span class="option-separator">—</span>
              <span class="option-text">${o.answer}</span>
              <span class="option-stats">${o.percentage} %</span>
            </li>
          `,
          )
          .join('')

        return `
        <div class="question">
          <div class="question-title">
            ${q.questionNum}. ${q.questionTitle}
          </div>
          <canvas id="chart-${index}" height="120"></canvas>

          <ul class="options-list">
            ${listItems}
          </ul>
        </div>

        <script>
          new Chart(document.getElementById('chart-${index}'), {
            type: 'bar',
            data: {
              labels: ${JSON.stringify(sortedOptions.map((o) => String(o.num)))},
              datasets: [{
                label: '% de respostas',
                data: ${JSON.stringify(sortedOptions.map((o) => o.percentage))},
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
                borderRadius: 6
              }]
            },
            options: {
              responsive: true,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    title: (items) => {
                      const idx = items[0].dataIndex
                      const options = ${JSON.stringify(sortedOptions.map((o) => o.answer))}
                      return options[idx]
                    },
                    label: (ctx) => ctx.raw + '%'
                  }
                }
              },
              scales: {
                x: {
                  title: {
                    display: true,
                    text: 'Opção',
                    font: { size: 12 },
                    color: '#666'
                  },
                  ticks: {
                    font: { size: 13, weight: 'bold' }
                  }
                },
                y: {
                  beginAtZero: true,
                  max: 100,
                  ticks: {
                    callback: (value) => value + '%'
                  }
                }
              }
            },
            plugins: [{
              id: 'labels',
              afterDatasetsDraw(chart) {
                const { ctx } = chart
                chart.data.datasets.forEach((dataset, i) => {
                  const meta = chart.getDatasetMeta(i)
                  meta.data.forEach((bar, index) => {
                    const value = dataset.data[index]
                    ctx.fillStyle = '#000'
                    ctx.font = '12px Arial'
                    ctx.textAlign = 'center'
                    ctx.fillText(value + '%', bar.x, bar.y - 5)
                  })
                })
              }
            }]
          })
        </script>
      `
      })
      .join('')}
  </body>
  </html>
  `
}
