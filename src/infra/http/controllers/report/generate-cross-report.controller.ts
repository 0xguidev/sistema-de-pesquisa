import { Controller, Get, Param, Res, Header } from '@nestjs/common'
import { GenerateCrossReportWordUseCase } from '@/domain/use-cases/report/generate-cross-report-word'
import { GenerateCrossReportUseCase } from '@/domain/use-cases/report/generate-cross-report'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { SurveyRepository } from '@/domain/repositories/survey-repository'

@Controller('/reports')
export class GenerateCrossReportController {
  constructor(
    private generateCrossReportWordUseCase: GenerateCrossReportWordUseCase,
    private generateCrossReportUseCase: GenerateCrossReportUseCase,
    private surveyRepository: SurveyRepository,
  ) {}

  @Get('/cross/:surveyId')
  async getData(@Param('surveyId') surveyId: string, @CurrentUser() user: UserPayload) {
    return this.generateCrossReportUseCase.execute(surveyId, user.sub)
  }

  @Get('/cross/:surveyId/download')
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
  async handle(@Param('surveyId') surveyId: string, @CurrentUser() user: UserPayload, @Res() res: any) {
    const survey = await this.surveyRepository.findById(surveyId)
    if (!survey) {
      throw new Error('Pesquisa não encontrada')
    }

    const currentDate = new Date()
    const month = String(currentDate.getMonth() + 1).padStart(2, '0')
    const year = currentDate.getFullYear()
    const dateSuffix = `${month}-${year}`

    const surveyName = survey.title.replace(/\s+/g, '-')
    const filename = `relatorio-cruzado-${surveyName}-${dateSuffix}.docx`

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    const buffer = await this.generateCrossReportWordUseCase.execute(surveyId, user.sub)
    res.send(buffer)
  }
}

