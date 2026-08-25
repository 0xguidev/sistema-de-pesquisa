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
import { GenerateSimpleReportWordUseCase } from '@/domain/use-cases/report/generate-simple-report-word'
import { GenerateSimpleReportUseCase } from '@/domain/use-cases/report/generate-simple-report'
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
    const survey = await this.surveyRepository.findByIdAndAccountId(
      surveyId,
      user.sub,
    )
    if (!survey) {
      throw new NotFoundException('Resource not found')
    }

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

    const surveyName = survey.title
    const filename = `relatorio-simples-${surveyName}-${dateSuffix}.docx`

    res.setHeader('Content-Disposition', attachmentContentDisposition(filename))

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
