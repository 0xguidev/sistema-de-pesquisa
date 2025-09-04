/*
  Warnings:

  - You are about to drop the column `answers` on the `interviews` table. All the data in the column will be lost.
  - You are about to drop the column `options` on the `questions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."interviews" DROP COLUMN "answers";

-- AlterTable
ALTER TABLE "public"."questions" DROP COLUMN "options";

-- CreateTable
CREATE TABLE "public"."ConditionalRule" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "dependsOnQuestionId" TEXT NOT NULL,
    "dependsOnOptionId" TEXT NOT NULL,
    "operator" TEXT NOT NULL,

    CONSTRAINT "ConditionalRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConditionalRule_id_key" ON "public"."ConditionalRule"("id");

-- AddForeignKey
ALTER TABLE "public"."ConditionalRule" ADD CONSTRAINT "ConditionalRule_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConditionalRule" ADD CONSTRAINT "ConditionalRule_dependsOnQuestionId_fkey" FOREIGN KEY ("dependsOnQuestionId") REFERENCES "public"."questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConditionalRule" ADD CONSTRAINT "ConditionalRule_dependsOnOptionId_fkey" FOREIGN KEY ("dependsOnOptionId") REFERENCES "public"."option_answers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
