/*
  Warnings:

  - The primary key for the `pdf_render_leases` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "pdf_render_leases" DROP CONSTRAINT "pdf_render_leases_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "pdf_render_leases_pkey" PRIMARY KEY ("id");
