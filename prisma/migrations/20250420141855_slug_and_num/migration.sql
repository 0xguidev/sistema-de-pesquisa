/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `answer_questions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `interviews` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `option_answers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `questions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `surveys` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `answer_questions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `answer_questions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `interviews` table without a default value. This is not possible if the table is not empty.
  - Added the required column `number` to the `option_answers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `option_answers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `option_answers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `number` to the `questions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `questions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `questions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location` to the `surveys` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `surveys` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "answer_questions" ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "interviews" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "option_answers" ADD COLUMN     "number" INTEGER NOT NULL,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "number" INTEGER NOT NULL,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "surveys" ADD COLUMN     "location" TEXT NOT NULL,
ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "answer_questions_slug_key" ON "answer_questions"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "interviews_slug_key" ON "interviews"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "option_answers_slug_key" ON "option_answers"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "questions_slug_key" ON "questions"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "surveys_slug_key" ON "surveys"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_slug_key" ON "users"("slug");

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "option_answers" ADD CONSTRAINT "option_answers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_questions" ADD CONSTRAINT "answer_questions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
