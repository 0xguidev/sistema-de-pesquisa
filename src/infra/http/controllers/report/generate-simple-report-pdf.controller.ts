import {
  Controller,
  Get,
  Param,
  Res,
  Header,
  NotFoundException,
  UseGuards,
} from '@nestjs/common'
import { SkipThrottle } from '@nestjs/throttler'
import { PublicRateLimitGuard } from '@/infra/rate-limit/public-rate-limit.guard'
import {
  LOGIN_IDENTIFIER_THROTTLER,
  LOGIN_IP_THROTTLER,
  REGISTER_IP_THROTTLER,
} from '@/infra/rate-limit/rate-limit.constants'
import { GenerateSimpleReportPdfUseCase } from '@/domain/use-cases/report/generate-simple-report-pdf'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { SurveyRepository } from '@/domain/repositories/survey-repository'
import { throwReportHttpError } from './report-error-mapper'
import { attachmentContentDisposition } from './content-disposition'

@Controller('/reports')
@UseGuards(PublicRateLimitGuard)
@SkipThrottle({
  [LOGIN_IP_THROTTLER]: true,
  [LOGIN_IDENTIFIER_THROTTLER]: true,
  [REGISTER_IP_THROTTLER]: true,
})
export class GenerateSimpleReportPdfController {
  constructor(
    private generateSimpleReportPdfUseCase: GenerateSimpleReportPdfUseCase,
    private surveyRepository: SurveyRepository,
  ) {}

  @Get('/simple-pdf/:surveyId')
  @Header('Content-Type', 'application/pdf')
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

    const surveyName = survey.title
    const filename = `relatorio-simples-${surveyName}-${dateSuffix}.pdf`

    res.setHeader('Content-Disposition', attachmentContentDisposition(filename))

    try {
      const buffer = await this.generateSimpleReportPdfUseCase.execute(
        surveyId,
        user.sub,
      )
      res.send(buffer)
    } catch (error) {
      throwReportHttpError(error)
    }
  }
}
