-- outfit_status enum 생성
DO $$ BEGIN
    CREATE TYPE public.outfit_status AS ENUM ('PENDING', 'IN_QUEUE', 'IN_PROGRESS', 'UPLOADING', 'COMPLETED', 'FAILED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- avatar_outfits 테이블 생성
CREATE TABLE IF NOT EXISTS public.avatar_outfits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    avatar_id UUID NOT NULL,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    status public.outfit_status DEFAULT 'PENDING' NOT NULL,
    fal_request_id TEXT,

    -- 입력 의상 이미지 (R2에 업로드된 URL)
    outfit_type TEXT NOT NULL, -- 'combined' | 'separate'
    outfit_image_url TEXT,     -- combined일 때 전체 의상 이미지
    top_image_url TEXT,        -- separate일 때 상의 이미지
    bottom_image_url TEXT,     -- separate일 때 하의 이미지
    shoes_image_url TEXT,      -- separate일 때 신발 이미지

    -- 출력 결과 이미지
    image_url TEXT,            -- 압축된 WebP 이미지 URL (조회용)
    image_url_original TEXT,   -- 원본 이미지 URL (재가공용)
    image_width INTEGER,
    image_height INTEGER,

    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ,

    -- Foreign keys
    CONSTRAINT fk_avatar_outfits_avatar FOREIGN KEY (avatar_id) REFERENCES public.avatars(id) ON DELETE CASCADE,
    CONSTRAINT fk_avatar_outfits_profile FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_avatar_outfits_avatar_id ON public.avatar_outfits(avatar_id);
CREATE INDEX IF NOT EXISTS idx_avatar_outfits_user_id ON public.avatar_outfits(user_id);
CREATE INDEX IF NOT EXISTS idx_avatar_outfits_status ON public.avatar_outfits(status);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.avatar_outfits ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자가 자신의 의상만 조회/수정할 수 있음 (idempotent)
DROP POLICY IF EXISTS "Users can view their own outfits" ON public.avatar_outfits;
CREATE POLICY "Users can view their own outfits" ON public.avatar_outfits
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own outfits" ON public.avatar_outfits;
CREATE POLICY "Users can insert their own outfits" ON public.avatar_outfits
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own outfits" ON public.avatar_outfits;
CREATE POLICY "Users can update their own outfits" ON public.avatar_outfits
    FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own outfits" ON public.avatar_outfits;
CREATE POLICY "Users can delete their own outfits" ON public.avatar_outfits
    FOR DELETE
    USING (auth.uid() = user_id);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION public.update_avatar_outfits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_avatar_outfits_updated_at ON public.avatar_outfits;
CREATE TRIGGER trigger_update_avatar_outfits_updated_at
    BEFORE UPDATE ON public.avatar_outfits
    FOR EACH ROW
    EXECUTE FUNCTION public.update_avatar_outfits_updated_at();
