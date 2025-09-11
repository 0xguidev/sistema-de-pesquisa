/*
  Warnings:

  - Added the required column `dependsOnOptionNumber` to the `ConditionalRule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dependsOnQuestionNumber` to the `ConditionalRule` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."ConditionalRule" ADD COLUMN     "dependsOnOptionNumber" INTEGER NOT NULL,
ADD COLUMN     "dependsOnQuestionNumber" INTEGER NOT NULL;
