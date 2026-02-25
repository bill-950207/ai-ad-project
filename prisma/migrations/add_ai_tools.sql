-- AI 도구 기능 마이그레이션
-- 1. credit_feature_type enum에 TOOL_VIDEO, TOOL_IMAGE 추가
-- 2. tool_generations 테이블 생성

-- Enum 값 추가
ALTER TYPE "public"."credit_feature_type" ADD VALUE IF NOT EXISTS 'TOOL_VIDEO';
ALTER TYPE "public"."credit_feature_type" ADD VALUE IF NOT EXISTS 'TOOL_IMAGE';

-- tool_generations 테이블 생성
CREATE TABLE IF NOT EXISTS "public"."tool_generations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "prompt" TEXT,
    "input_params" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "provider_task_id" TEXT,
    "result_url" TEXT,
    "thumbnail_url" TEXT,
    "error_message" TEXT,
    "credits_used" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tool_generations_pkey" PRIMARY KEY ("id")
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS "idx_tool_generations_user_type" ON "public"."tool_generations"("user_id", "type", "created_at" DESC);

-- 외래키 설정
ALTER TABLE "public"."tool_generations"
    ADD CONSTRAINT "tool_generations_user_id_fkey"
    FOREIGN KEY ("user_id")
    REFERENCES "public"."profiles"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
