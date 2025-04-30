/*
  Warnings:

  - You are about to drop the column `slug` on the `answer_questions` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `interviews` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "answer_questions_slug_key";

-- DropIndex
DROP INDEX "interviews_slug_key";

-- AlterTable
ALTER TABLE "answer_questions" DROP COLUMN "slug";

-- AlterTable
ALTER TABLE "interviews" DROP COLUMN "slug";
