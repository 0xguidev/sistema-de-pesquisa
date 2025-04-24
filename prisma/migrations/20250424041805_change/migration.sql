/*
  Warnings:

  - You are about to drop the column `type` on the `questions` table. All the data in the column will be lost.
  - Added the required column `type` to the `surveys` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "questions" DROP COLUMN "type";

-- AlterTable
ALTER TABLE "surveys" ADD COLUMN     "type" TEXT NOT NULL;
