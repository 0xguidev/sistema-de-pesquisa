import { Survey } from '../entities/survey'

export abstract class SurveyRepository {
  abstract create(survey: Survey): Promise<void>
}
