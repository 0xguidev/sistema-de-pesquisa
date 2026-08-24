-- Read-only preflight for 20260824120000_enforce_survey_ownership.
-- Every query must return zero rows before the migration is applied.

SELECT 'question_survey_owner_mismatch' AS violation, q."id" AS record_id
FROM "questions" q
JOIN "surveys" s ON s."id" = q."surveyId"
WHERE q."userId" <> s."userId";

SELECT 'option_question_owner_mismatch' AS violation, o."id" AS record_id
FROM "option_answers" o
JOIN "questions" q ON q."id" = o."questionId"
WHERE o."userId" <> q."userId";

SELECT 'interview_survey_owner_mismatch' AS violation, i."id" AS record_id
FROM "interviews" i
JOIN "surveys" s ON s."id" = i."surveyId"
WHERE i."userId" <> s."userId";

SELECT 'answer_relationship_mismatch' AS violation, a."id" AS record_id
FROM "answer_questions" a
JOIN "interviews" i ON i."id" = a."interviewId"
JOIN "questions" q ON q."id" = a."questionId"
JOIN "option_answers" o ON o."id" = a."optionAnswerId"
WHERE a."userId" <> i."userId"
   OR a."userId" <> q."userId"
   OR a."userId" <> o."userId"
   OR o."questionId" <> a."questionId"
   OR q."surveyId" <> i."surveyId";

SELECT 'duplicate_interview_question' AS violation,
       "interviewId", "questionId", count(*) AS duplicate_count
FROM "answer_questions"
GROUP BY "interviewId", "questionId"
HAVING count(*) > 1;
