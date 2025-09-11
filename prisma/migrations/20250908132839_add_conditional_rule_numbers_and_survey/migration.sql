/*
  Warnings:

  - You are about to drop the `ConditionalRule` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ConditionalRule" DROP CONSTRAINT "ConditionalRule_dependsOnOptionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ConditionalRule" DROP CONSTRAINT "ConditionalRule_dependsOnQuestionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ConditionalRule" DROP CONSTRAINT "ConditionalRule_questionId_fkey";

-- DropTable
DROP TABLE "public"."ConditionalRule";

-- CreateTable
CREATE TABLE "public"."conditional_rules" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "dependsOnQuestionNumber" INTEGER NOT NULL,
    "dependsOnQuestionId" TEXT NOT NULL,
    "dependsOnOptionNumber" INTEGER NOT NULL,
    "dependsOnOptionId" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,

    CONSTRAINT "conditional_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conditional_rules_id_key" ON "public"."conditional_rules"("id");

-- AddForeignKey
ALTER TABLE "public"."conditional_rules" ADD CONSTRAINT "conditional_rules_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conditional_rules" ADD CONSTRAINT "conditional_rules_dependsOnQuestionId_fkey" FOREIGN KEY ("dependsOnQuestionId") REFERENCES "public"."questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conditional_rules" ADD CONSTRAINT "conditional_rules_dependsOnOptionId_fkey" FOREIGN KEY ("dependsOnOptionId") REFERENCES "public"."option_answers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conditional_rules" ADD CONSTRAINT "conditional_rules_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "public"."surveys"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
