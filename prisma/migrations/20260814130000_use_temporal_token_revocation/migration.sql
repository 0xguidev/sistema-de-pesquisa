-- Preserve existing revocations while making their temporal meaning explicit.
ALTER TABLE "revoked_token_subjects"
RENAME COLUMN "revoked_at" TO "revoked_before";
