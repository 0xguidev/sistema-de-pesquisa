import { Controller, Get, Param, Res, Header } from '@nestjs/common'
import { GenerateCrossReportPdfUseCase } from '@/domain/use-cases/report/generate-cross-report-pdf'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { SurveyRepository } from '@/domain/repositories/survey-repository'

@Controller('/reports')
export class GenerateCrossReportPdfController {
  constructor(
    private generateCrossReportPdfUseCase: GenerateCrossReportPdfUseCase,
    private surveyRepository: SurveyRepository,
  ) {}

  @Get('/cross-pdf/:surveyId')
  @Header('Content-Type', 'application/pdf')
  async handle(
    @Param('surveyId') surveyId: string,
    @CurrentUser() user: UserPayload,
    @Res() res: any,
  ) {
    const survey = await this.surveyRepository.findById(surveyId)
    if (!survey) {
      throw new Error('Pesquisa não encontrada')
    }

    const currentDate = new Date()
    const month = String(currentDate.getMonth() + 1).padStart(2, '0')
    const year = currentDate.getFullYear()
    const dateSuffix = `${month}-${year}`

    const surveyName = survey.title.replace(/\s+/g, '-')
    const filename = `relatorio-cruzado-${surveyName}-${dateSuffix}.pdf`

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    const buffer = await this.generateCrossReportPdfUseCase.execute(
      surveyId,
      user.sub,
    )
    res.send(buffer)
  }
}
