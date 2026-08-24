-- This migration intentionally performs no corrective deletes or ownership rewrites.
-- Run prisma/ownership-prevalidation.sql before deployment to inspect offending rows.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "questions" q
    JOIN "surveys" s ON s."id" = q."surveyId"
    WHERE q."userId" <> s."userId"
  ) THEN
    RAISE EXCEPTION 'Ownership migration blocked: questions.userId differs from its survey owner. Run prisma/ownership-prevalidation.sql and correct the reported data.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "option_answers" o
    JOIN "questions" q ON q."id" = o."questionId"
    WHERE o."userId" <> q."userId"
  ) THEN
    RAISE EXCEPTION 'Ownership migration blocked: option_answers.userId differs from its question owner. Run prisma/ownership-prevalidation.sql and correct the reported data.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "interviews" i
    JOIN "surveys" s ON s."id" = i."surveyId"
    WHERE i."userId" <> s."userId"
  ) THEN
    RAISE EXCEPTION 'Ownership migration blocked: interviews.userId differs from its survey owner. Run prisma/ownership-prevalidation.sql and correct the reported data.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "answer_questions" a
    JOIN "interviews" i ON i."id" = a."interviewId"
    JOIN "questions" q ON q."id" = a."questionId"
    JOIN "option_answers" o ON o."id" = a."optionAnswerId"
    WHERE a."userId" <> i."userId"
       OR a."userId" <> q."userId"
       OR a."userId" <> o."userId"
       OR o."questionId" <> a."questionId"
       OR q."surveyId" <> i."surveyId"
  ) THEN
    RAISE EXCEPTION 'Ownership migration blocked: an answer has inconsistent interview, survey, question, option, or user associations. Run prisma/ownership-prevalidation.sql and correct the reported data.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "answer_questions"
    GROUP BY "interviewId", "questionId"
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Ownership migration blocked: duplicate answers exist for the same interview and question. Run prisma/ownership-prevalidation.sql and resolve them explicitly.';
  END IF;
END $$;

ALTER TABLE "answer_questions" ADD COLUMN "surveyId" TEXT;

-- The value is unambiguous after the checks above: every answer inherits its
-- interview survey, which has already been proven equal to the question survey.
UPDATE "answer_questions" a
SET "surveyId" = i."surveyId"
FROM "interviews" i
WHERE i."id" = a."interviewId";

ALTER TABLE "answer_questions" ALTER COLUMN "surveyId" SET NOT NULL;

ALTER TABLE "answer_questions" DROP CONSTRAINT "answer_questions_interviewId_fkey";
ALTER TABLE "answer_questions" DROP CONSTRAINT "answer_questions_questionId_fkey";
ALTER TABLE "answer_questions" DROP CONSTRAINT "answer_questions_optionAnswerId_fkey";
ALTER TABLE "option_answers" DROP CONSTRAINT "option_answers_questionId_fkey";
ALTER TABLE "questions" DROP CONSTRAINT "questions_surveyId_fkey";
ALTER TABLE "interviews" DROP CONSTRAINT "interviews_surveyId_fkey";

CREATE UNIQUE INDEX "surveys_id_userId_key" ON "surveys"("id", "userId");
CREATE UNIQUE INDEX "questions_id_userId_key" ON "questions"("id", "userId");
CREATE UNIQUE INDEX "questions_id_surveyId_userId_key" ON "questions"("id", "surveyId", "userId");
CREATE INDEX "questions_surveyId_userId_idx" ON "questions"("surveyId", "userId");
CREATE UNIQUE INDEX "option_answers_id_userId_key" ON "option_answers"("id", "userId");
CREATE UNIQUE INDEX "option_answers_id_questionId_userId_key" ON "option_answers"("id", "questionId", "userId");
CREATE INDEX "option_answers_questionId_userId_idx" ON "option_answers"("questionId", "userId");
CREATE UNIQUE INDEX "interviews_id_userId_key" ON "interviews"("id", "userId");
CREATE UNIQUE INDEX "interviews_id_surveyId_userId_key" ON "interviews"("id", "surveyId", "userId");
CREATE INDEX "interviews_surveyId_userId_idx" ON "interviews"("surveyId", "userId");
CREATE UNIQUE INDEX "answer_questions_interviewId_questionId_key" ON "answer_questions"("interviewId", "questionId");
CREATE INDEX "answer_questions_interviewId_surveyId_userId_idx" ON "answer_questions"("interviewId", "surveyId", "userId");
CREATE INDEX "answer_questions_questionId_surveyId_userId_idx" ON "answer_questions"("questionId", "surveyId", "userId");
CREATE INDEX "answer_questions_optionAnswerId_questionId_userId_idx" ON "answer_questions"("optionAnswerId", "questionId", "userId");

ALTER TABLE "questions" ADD CONSTRAINT "questions_surveyId_userId_fkey"
  FOREIGN KEY ("surveyId", "userId") REFERENCES "surveys"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "option_answers" ADD CONSTRAINT "option_answers_questionId_userId_fkey"
  FOREIGN KEY ("questionId", "userId") REFERENCES "questions"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_surveyId_userId_fkey"
  FOREIGN KEY ("surveyId", "userId") REFERENCES "surveys"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "answer_questions" ADD CONSTRAINT "answer_questions_interviewId_surveyId_userId_fkey"
  FOREIGN KEY ("interviewId", "surveyId", "userId") REFERENCES "interviews"("id", "surveyId", "userId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "answer_questions" ADD CONSTRAINT "answer_questions_questionId_surveyId_userId_fkey"
  FOREIGN KEY ("questionId", "surveyId", "userId") REFERENCES "questions"("id", "surveyId", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "answer_questions" ADD CONSTRAINT "answer_questions_optionAnswerId_questionId_userId_fkey"
  FOREIGN KEY ("optionAnswerId", "questionId", "userId") REFERENCES "option_answers"("id", "questionId", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;
