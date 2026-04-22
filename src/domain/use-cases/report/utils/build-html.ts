type Option = {
  num: number
  answer: string
  percentage: number
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
    </style>
  </head>

  <body>
    <h1>Relatório da Pesquisa</h1>

    ${questions
      .map((q, index) => {
        // 🔥 CORREÇÃO AQUI
        const sortedOptions = [...q.options].sort(
          (a, b) => a.num - b.num,
        )

        return `
        <div class="question">
          <div class="question-title">
            ${q.questionNum}. ${q.questionTitle}
          </div>
          <canvas id="chart-${index}" height="120"></canvas>
        </div>

        <script>
          new Chart(document.getElementById('chart-${index}'), {
            type: 'bar',
            data: {
              labels: ${JSON.stringify(
                sortedOptions.map((o) => o.answer),
              )},
              datasets: [{
                label: '% de respostas',
                data: ${JSON.stringify(
                  sortedOptions.map((o) => o.percentage),
                )},
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
                    label: (ctx) => ctx.raw + '%'
                  }
                }
              },
              scales: {
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