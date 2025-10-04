import { Controller, Get, Param, Res, Header } from '@nestjs/common'
import { GenerateCrossTabulationWordUseCase } from '@/domain/use-cases/report/generate-cross-tabulation-word'
import { GenerateCrossTabulationUseCase } from '@/domain/use-cases/report/generate-cross-tabulation'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'

@Controller('/reports')
export class GenerateCrossTabulationController {
  constructor(
    private generateCrossTabulationWordUseCase: GenerateCrossTabulationWordUseCase,
    private generateCrossTabulationUseCase: GenerateCrossTabulationUseCase,
  ) {}

  @Get('/cross/:surveyId')
  async getData(@Param('surveyId') surveyId: string, @CurrentUser() user: UserPayload) {
    return this.generateCrossTabulationUseCase.execute(surveyId, user.sub)
  }

  @Get('/cross/:surveyId/download')
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
  @Header('Content-Disposition', 'attachment; filename="relatorio-cruzado.docx"')
  async handle(@Param('surveyId') surveyId: string, @CurrentUser() user: UserPayload, @Res() res: any) {
    const buffer = await this.generateCrossTabulationWordUseCase.execute(surveyId, user.sub)
    res.send(buffer)
  }
}
