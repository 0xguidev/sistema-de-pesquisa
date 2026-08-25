CREATE TABLE "pdf_render_leases" (
    "id" UUID NOT NULL,
    "account_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pdf_render_leases_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pdf_render_leases_account_id_expires_at_idx"
ON "pdf_render_leases"("account_id", "expires_at");

CREATE INDEX "pdf_render_leases_expires_at_idx"
ON "pdf_render_leases"("expires_at");
