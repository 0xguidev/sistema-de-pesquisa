/*
  Warnings:

  - The `type` column on the `surveys` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "TypeSurvey" AS ENUM ('POLITICAL', 'ADMINISTRATIVE');

-- AlterTable
ALTER TABLE "surveys" DROP COLUMN "type",
ADD COLUMN     "type" "TypeSurvey" NOT NULL DEFAULT 'POLITICAL';
