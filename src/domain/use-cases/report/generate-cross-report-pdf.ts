import { Injectable } from '@nestjs/common'
import { GenerateCrossReportUseCase } from './generate-cross-report'
import puppeteer from 'puppeteer'
import { buildCrossHtml } from './utils/build-cross-html'

@Injectable()
export class GenerateCrossReportPdfUseCase {
  constructor(
    private generateCrossReportUseCase: GenerateCrossReportUseCase,
  ) {}

  async execute(surveyId: string, accountId: string): Promise<Buffer> {
    const crossData = await this.generateCrossReportUseCase.execute(
      surveyId,
      accountId,
    )

    if (!crossData || crossData.length === 0) {
      throw new Error('Nenhum dado cruzado encontrado')
    }

    const html = buildCrossHtml(crossData)

    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium',
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    })

    const page = await browser.newPage()

    await page.setContent(html, {
      waitUntil: 'networkidle0',
    })

    // 🔥 importante: esperar gráficos renderizarem
    await new Promise((resolve) => setTimeout(resolve, 500))

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: false,
      margin: {
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px',
      },
    })

    await browser.close()

    return Buffer.from(pdf)
  }
}