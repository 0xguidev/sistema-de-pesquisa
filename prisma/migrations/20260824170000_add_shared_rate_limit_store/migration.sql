CREATE TABLE "rate_limit_buckets" (
    "key" TEXT NOT NULL,
    "total_hits" INTEGER NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "blocked_until" TIMESTAMP(3),
    CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "rate_limit_buckets_expires_at_idx" ON "rate_limit_buckets"("expires_at");
