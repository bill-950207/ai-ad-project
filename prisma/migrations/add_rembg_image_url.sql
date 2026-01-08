-- 배경 제거된 원본 이미지 URL 컬럼 추가 (카드 표시용)
ALTER TABLE public.ad_products
ADD COLUMN IF NOT EXISTS rembg_image_url TEXT;
