import { Controller, Get, Param } from '@nestjs/common'
import { GenerateSimpleReportUseCase } from '@/domain/use-cases/report/generate-simple-report'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'

@Controller('/reports')
export class GenerateSimpleReportController {
  constructor(private generateSimpleReportUseCase: GenerateSimpleReportUseCase) {}

  @Get('/simple/:surveyId')
  async handle(@Param('surveyId') surveyId: string, @CurrentUser() user: UserPayload) {
    const report = await this.generateSimpleReportUseCase.execute(surveyId, user.sub)
    return report
  }
}
