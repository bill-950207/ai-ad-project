-- ad_product_status enum 생성
DO $$ BEGIN
    CREATE TYPE public.ad_product_status AS ENUM ('PENDING', 'IN_QUEUE', 'IN_PROGRESS', 'UPLOADING', 'COMPLETED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ad_products 테이블 생성
CREATE TABLE IF NOT EXISTS public.ad_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    status public.ad_product_status DEFAULT 'PENDING' NOT NULL,
    fal_request_id TEXT,

    -- 원본 이미지 (배경 제거 전)
    source_image_url TEXT,

    -- 결과 이미지 (배경 제거 후)
    image_url TEXT,            -- 압축 WebP (조회용)
    image_url_original TEXT,   -- 원본 PNG (재가공용)
    image_width INTEGER,
    image_height INTEGER,

    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ,

    -- Foreign keys
    CONSTRAINT fk_ad_products_profile FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_ad_products_user_id ON public.ad_products(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_products_status ON public.ad_products(status);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.ad_products ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자가 자신의 광고 제품만 조회/수정할 수 있음 (idempotent)
DROP POLICY IF EXISTS "Users can view their own ad products" ON public.ad_products;
CREATE POLICY "Users can view their own ad products" ON public.ad_products
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own ad products" ON public.ad_products;
CREATE POLICY "Users can insert their own ad products" ON public.ad_products
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own ad products" ON public.ad_products;
CREATE POLICY "Users can update their own ad products" ON public.ad_products
    FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own ad products" ON public.ad_products;
CREATE POLICY "Users can delete their own ad products" ON public.ad_products
    FOR DELETE
    USING (auth.uid() = user_id);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION public.update_ad_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ad_products_updated_at ON public.ad_products;
CREATE TRIGGER trigger_update_ad_products_updated_at
    BEFORE UPDATE ON public.ad_products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_ad_products_updated_at();
