-- 사용자 설정 필드 추가
-- 이메일 알림 및 마케팅 이메일 수신 동의

ALTER TABLE "public"."profiles"
ADD COLUMN IF NOT EXISTS "email_notifications" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "marketing_emails" BOOLEAN DEFAULT false;

-- 기존 사용자에게 기본값 적용
UPDATE "public"."profiles"
SET "email_notifications" = true
WHERE "email_notifications" IS NULL;

UPDATE "public"."profiles"
SET "marketing_emails" = false
WHERE "marketing_emails" IS NULL;
