import {
  Controller,
  Get,
  Param,
  Res,
  Header,
  NotFoundException,
} from '@nestjs/common'
import { GenerateSimpleReportWordUseCase } from '@/domain/use-cases/report/generate-simple-report-word'
import { GenerateSimpleReportUseCase } from '@/domain/use-cases/report/generate-simple-report'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { SurveyRepository } from '@/domain/repositories/survey-repository'
import { throwReportHttpError } from './report-error-mapper'

@Controller('/reports')
export class GenerateSimpleReportController {
  constructor(
    private generateSimpleReportWordUseCase: GenerateSimpleReportWordUseCase,
    private generateSimpleReportUseCase: GenerateSimpleReportUseCase,
    private surveyRepository: SurveyRepository,
  ) {}

  @Get('/simple/:surveyId')
  async getData(
    @Param('surveyId') surveyId: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.generateSimpleReportUseCase.execute(surveyId, user.sub)
  }

  @Get('/simple/:surveyId/download')
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  )
  async handle(
    @Param('surveyId') surveyId: string,
    @CurrentUser() user: UserPayload,
    @Res() res: any,
  ) {
    const survey = await this.surveyRepository.findByIdAndAccountId(
      surveyId,
      user.sub,
    )
    if (!survey) {
      throw new NotFoundException('Resource not found')
    }

    const currentDate = new Date()
    const month = String(currentDate.getMonth() + 1).padStart(2, '0')
    const year = currentDate.getFullYear()
    const dateSuffix = `${month}-${year}`

    const surveyName = survey.title.replace(/\s+/g, '-')
    const filename = `relatorio-simples-${surveyName}-${dateSuffix}.docx`

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    try {
      const buffer = await this.generateSimpleReportWordUseCase.execute(
        surveyId,
        user.sub,
      )
      res.send(buffer)
    } catch (error) {
      throwReportHttpError(error)
    }
  }
}
