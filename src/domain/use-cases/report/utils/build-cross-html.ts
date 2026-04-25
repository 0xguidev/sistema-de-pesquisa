import type { CrossReportData } from '../generate-cross-report'

type CrossAnswer = {
  numA: number
  answerA: string
  numB: number
  answerB: string
  percentage: number
}

interface GroupedCell {
  answerB: string
  numB: number
  percentage: number
}

interface Group {
  answerA: string
  numA: number
  cells: GroupedCell[]
}

export function buildCrossHtml(crossData: CrossReportData[]): string {
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
      color: #1f2937;
      background: #ffffff;
    }

    h1 {
      text-align: center;
      margin-bottom: 40px;
      color: #1e3a8a;
    }

    .cross-section {
      margin-bottom: 60px;
      page-break-inside: avoid;
    }

    .cross-title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 20px;
      display: flex;
      gap: 20px;
      color: #1e40af;
    }

    .question-label {
      font-weight: bold;
      min-width: 200px;
    }

    table {
      border-collapse: collapse;
      width: 100%;
      margin-top: 10px;
    }

    th, td {
      border: 1px solid #e5e7eb;
      padding: 8px;
      text-align: center;
    }

    th {
      background-color: #eff6ff;
      font-weight: bold;
      color: #1e3a8a;
    }

    .cell {
      font-weight: bold;
      color: #111827;
    }

    canvas {
      margin-top: 30px;
    }
  </style>
</head>

<body>
  <h1>Relatório Cruzado da Pesquisa</h1>

  ${crossData.map((cross, index) => {
    const grouped = groupByAnswerA(cross.answers)
    const headers = getSortedHeaders(cross.answers)

    return `
    <div class="cross-section">
      
      <div class="cross-title">
        <span class="question-label">${cross.questionANum}. ${cross.questionA}</span>
        <span>X</span>
        <span class="question-label">${cross.questionBNum}. ${cross.questionB}</span>
      </div>

      <table>
        <thead>
          <tr>
            <th></th>
            ${headers.map(h => `<th>${h.answerB}</th>`).join('')}
          </tr>
        </thead>

        <tbody>
          ${grouped.map(group => `
            <tr>
              <th>${group.numA}. ${group.answerA}</th>

              ${headers.map(header => {
                const cell = group.cells.find(c => c.numB === header.numB)

                if (cell) {
                  const pct = cell.percentage

                  return `
                    <td class="cell"
                      style="
                        background: linear-gradient(
                          90deg,
                          rgba(59,130,246,${pct / 100}) 0%,
                          rgba(16,185,129,${pct / 100}) 100%
                        );
                      "
                    >
                      ${pct.toFixed(1)}%
                    </td>
                  `
                }

                return '<td>-</td>'
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>

      <canvas id="chart-${index}" height="120"></canvas>
    </div>
    `
  }).join('')}

  <script>
    ${crossData.map((cross, index) => {
      const grouped = groupByAnswerA(cross.answers)
      const headers = getSortedHeaders(cross.answers)

      return `
      new Chart(document.getElementById('chart-${index}'), {
        type: 'bar',
        data: {
          labels: ${JSON.stringify(headers.map(h => h.answerB))},
          datasets: ${JSON.stringify(
            grouped.map((group, i) => ({
              label: group.answerA,
              data: headers.map(h => {
                const cell = group.cells.find(c => c.numB === h.numB)
                return cell ? cell.percentage : 0
              }),
              backgroundColor: i % 2 === 0
                ? 'rgba(59,130,246,0.7)'   // azul
                : 'rgba(16,185,129,0.7)', // verde
              borderRadius: 6
            }))
          )}
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'top' }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: {
                callback: value => value + '%'
              }
            }
          }
        }
      })
      `
    }).join('')}
  </script>

</body>
</html>
`
}

// 🔹 agrupamento ordenado por numA
function groupByAnswerA(answers: CrossAnswer[]): Group[] {
  const map = new Map<number, Group>()

  for (const a of answers) {
    if (!map.has(a.numA)) {
      map.set(a.numA, {
        answerA: a.answerA,
        numA: a.numA,
        cells: [],
      })
    }

    map.get(a.numA)!.cells.push({
      answerB: a.answerB,
      numB: a.numB,
      percentage: a.percentage,
    })
  }

  return Array.from(map.values()).sort((a, b) => a.numA - b.numA)
}

// 🔹 headers ordenados por numB
function getSortedHeaders(answers: CrossAnswer[]) {
  const map = new Map<number, { numB: number; answerB: string }>()

  for (const a of answers) {
    if (!map.has(a.numB)) {
      map.set(a.numB, {
        numB: a.numB,
        answerB: a.answerB,
      })
    }
  }

  return Array.from(map.values()).sort((a, b) => a.numB - b.numB)
}