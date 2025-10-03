import { Controller, Get, Param } from '@nestjs/common'
import { GenerateCrossTabulationUseCase } from '@/domain/use-cases/report/generate-cross-tabulation'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'

@Controller('/reports')
export class GenerateCrossTabulationController {
  constructor(private generateCrossTabulationUseCase: GenerateCrossTabulationUseCase) {}

  @Get('/cross/:surveyId')
  async handle(@Param('surveyId') surveyId: string, @CurrentUser() user: UserPayload) {
    const report = await this.generateCrossTabulationUseCase.execute(surveyId, user.sub)
    return report
  }
}
