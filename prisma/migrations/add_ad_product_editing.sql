-- 광고 제품에 EDITING 상태와 rembg_temp_url 컬럼 추가

-- 1. EDITING 상태 추가 (이미 있으면 무시)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'EDITING'
    AND enumtypid = 'public.ad_product_status'::regtype
  ) THEN
    ALTER TYPE public.ad_product_status ADD VALUE 'EDITING' AFTER 'IN_PROGRESS';
  END IF;
END
$$;

-- 2. rembg_temp_url 컬럼 추가
ALTER TABLE public.ad_products
ADD COLUMN IF NOT EXISTS rembg_temp_url TEXT;
