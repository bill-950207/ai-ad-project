-- Migration: Foreign Key Cascade Fix
-- Description: Add ON DELETE SET NULL to image_ads and video_ads foreign keys
-- This prevents orphaned records when avatars or products are deleted

-- ============================================================
-- image_ads 테이블 외래키 수정
-- ============================================================

-- 1. avatar_id 외래키 수정
ALTER TABLE "public"."image_ads"
DROP CONSTRAINT IF EXISTS "image_ads_avatar_id_fkey";

ALTER TABLE "public"."image_ads"
ADD CONSTRAINT "image_ads_avatar_id_fkey"
FOREIGN KEY ("avatar_id")
REFERENCES "public"."avatars"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- 2. outfit_id 외래키 수정
ALTER TABLE "public"."image_ads"
DROP CONSTRAINT IF EXISTS "image_ads_outfit_id_fkey";

ALTER TABLE "public"."image_ads"
ADD CONSTRAINT "image_ads_outfit_id_fkey"
FOREIGN KEY ("outfit_id")
REFERENCES "public"."avatar_outfits"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- 3. product_id 외래키 수정
ALTER TABLE "public"."image_ads"
DROP CONSTRAINT IF EXISTS "image_ads_product_id_fkey";

ALTER TABLE "public"."image_ads"
ADD CONSTRAINT "image_ads_product_id_fkey"
FOREIGN KEY ("product_id")
REFERENCES "public"."ad_products"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- ============================================================
-- video_ads 테이블 외래키 수정
-- ============================================================

-- 1. avatar_id 외래키 수정
ALTER TABLE "public"."video_ads"
DROP CONSTRAINT IF EXISTS "video_ads_avatar_id_fkey";

ALTER TABLE "public"."video_ads"
ADD CONSTRAINT "video_ads_avatar_id_fkey"
FOREIGN KEY ("avatar_id")
REFERENCES "public"."avatars"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- 2. product_id 외래키 수정
ALTER TABLE "public"."video_ads"
DROP CONSTRAINT IF EXISTS "video_ads_product_id_fkey";

ALTER TABLE "public"."video_ads"
ADD CONSTRAINT "video_ads_product_id_fkey"
FOREIGN KEY ("product_id")
REFERENCES "public"."ad_products"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- ============================================================
-- 변경 확인 쿼리 (선택사항)
-- ============================================================
-- SELECT
--     tc.table_name,
--     kcu.column_name,
--     rc.delete_rule,
--     rc.update_rule
-- FROM information_schema.table_constraints tc
-- JOIN information_schema.key_column_usage kcu
--     ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.referential_constraints rc
--     ON tc.constraint_name = rc.constraint_name
-- WHERE tc.constraint_type = 'FOREIGN KEY'
--     AND tc.table_name IN ('image_ads', 'video_ads')
--     AND tc.table_schema = 'public';
