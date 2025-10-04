import { Controller, Get, Param, Res, Header } from '@nestjs/common'
import { GenerateSimpleReportWordUseCase } from '@/domain/use-cases/report/generate-simple-report-word'
import { GenerateSimpleReportUseCase } from '@/domain/use-cases/report/generate-simple-report'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'

@Controller('/reports')
export class GenerateSimpleReportController {
  constructor(
    private generateSimpleReportWordUseCase: GenerateSimpleReportWordUseCase,
    private generateSimpleReportUseCase: GenerateSimpleReportUseCase,
  ) {}

  @Get('/simple/:surveyId')
  async getData(@Param('surveyId') surveyId: string, @CurrentUser() user: UserPayload) {
    return this.generateSimpleReportUseCase.execute(surveyId, user.sub)
  }

  @Get('/simple/:surveyId/download')
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
  @Header('Content-Disposition', 'attachment; filename="relatorio-simples.docx"')
  async handle(@Param('surveyId') surveyId: string, @CurrentUser() user: UserPayload, @Res() res: any) {
    const buffer = await this.generateSimpleReportWordUseCase.execute(surveyId, user.sub)
    res.send(buffer)
  }
}
