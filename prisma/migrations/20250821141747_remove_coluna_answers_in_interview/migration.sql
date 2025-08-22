/*
  Warnings:

  - You are about to drop the column `answers` on the `interviews` table. All the data in the column will be lost.
  - You are about to drop the column `options` on the `questions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."interviews" DROP COLUMN "answers";

-- AlterTable
ALTER TABLE "public"."questions" DROP COLUMN "options";
