-- video_ad_status enum 생성
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'video_ad_status') THEN
        CREATE TYPE public.video_ad_status AS ENUM (
            'PENDING',
            'IN_QUEUE',
            'IN_PROGRESS',
            'UPLOADING',
            'COMPLETED',
            'FAILED'
        );
    END IF;
END
$$;

-- video_ads 테이블 생성
CREATE TABLE IF NOT EXISTS public.video_ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.ad_products(id) ON DELETE SET NULL,
    avatar_id UUID REFERENCES public.avatars(id) ON DELETE SET NULL,

    status public.video_ad_status DEFAULT 'PENDING',
    fal_request_id TEXT,

    -- 생성 옵션
    prompt TEXT,
    prompt_expanded TEXT,
    duration INT,
    resolution TEXT,

    -- 제품 정보
    product_info TEXT,
    product_url TEXT,
    product_summary TEXT,

    -- 결과 영상
    video_url TEXT,
    video_width INT,
    video_height INT,
    video_fps INT,
    video_duration FLOAT,
    thumbnail_url TEXT,

    seed INT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_video_ads_user_id ON public.video_ads(user_id);
CREATE INDEX IF NOT EXISTS idx_video_ads_product_id ON public.video_ads(product_id);
CREATE INDEX IF NOT EXISTS idx_video_ads_avatar_id ON public.video_ads(avatar_id);
CREATE INDEX IF NOT EXISTS idx_video_ads_status ON public.video_ads(status);

-- RLS 활성화
ALTER TABLE public.video_ads ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
DROP POLICY IF EXISTS "Users can view own video ads" ON public.video_ads;
CREATE POLICY "Users can view own video ads" ON public.video_ads
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own video ads" ON public.video_ads;
CREATE POLICY "Users can insert own video ads" ON public.video_ads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own video ads" ON public.video_ads;
CREATE POLICY "Users can update own video ads" ON public.video_ads
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own video ads" ON public.video_ads;
CREATE POLICY "Users can delete own video ads" ON public.video_ads
    FOR DELETE USING (auth.uid() = user_id);
