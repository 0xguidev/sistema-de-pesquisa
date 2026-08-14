CREATE TABLE "revoked_token_subjects" (
    "account_id" TEXT NOT NULL,
    "revoked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revoked_token_subjects_pkey" PRIMARY KEY ("account_id")
);
