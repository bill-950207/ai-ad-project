-- image_ad_status enum 생성
DO $$ BEGIN
  CREATE TYPE public.image_ad_status AS ENUM (
    'PENDING',
    'IN_QUEUE',
    'IN_PROGRESS',
    'UPLOADING',
    'COMPLETED',
    'FAILED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- image_ads 테이블 생성
CREATE TABLE IF NOT EXISTS public.image_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.ad_products(id) ON DELETE SET NULL,
  avatar_id UUID REFERENCES public.avatars(id) ON DELETE SET NULL,
  outfit_id UUID REFERENCES public.avatar_outfits(id) ON DELETE SET NULL,
  
  ad_type TEXT NOT NULL,
  status public.image_ad_status DEFAULT 'PENDING' NOT NULL,
  fal_request_id TEXT,
  
  -- 생성 옵션
  prompt TEXT,
  image_size TEXT,
  quality TEXT,
  
  -- 결과 이미지
  image_url TEXT,
  image_url_original TEXT,
  image_width INTEGER,
  image_height INTEGER,
  
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_image_ads_user_id ON public.image_ads(user_id);
CREATE INDEX IF NOT EXISTS idx_image_ads_product_id ON public.image_ads(product_id);
CREATE INDEX IF NOT EXISTS idx_image_ads_avatar_id ON public.image_ads(avatar_id);
CREATE INDEX IF NOT EXISTS idx_image_ads_status ON public.image_ads(status);
CREATE INDEX IF NOT EXISTS idx_image_ads_ad_type ON public.image_ads(ad_type);

-- RLS 활성화
ALTER TABLE public.image_ads ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 이미지 광고만 조회 가능
DROP POLICY IF EXISTS "Users can view their own image ads" ON public.image_ads;
CREATE POLICY "Users can view their own image ads"
  ON public.image_ads FOR SELECT
  USING (auth.uid() = user_id);

-- RLS 정책: 사용자는 자신의 이미지 광고만 생성 가능
DROP POLICY IF EXISTS "Users can create their own image ads" ON public.image_ads;
CREATE POLICY "Users can create their own image ads"
  ON public.image_ads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS 정책: 사용자는 자신의 이미지 광고만 수정 가능
DROP POLICY IF EXISTS "Users can update their own image ads" ON public.image_ads;
CREATE POLICY "Users can update their own image ads"
  ON public.image_ads FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS 정책: 사용자는 자신의 이미지 광고만 삭제 가능
DROP POLICY IF EXISTS "Users can delete their own image ads" ON public.image_ads;
CREATE POLICY "Users can delete their own image ads"
  ON public.image_ads FOR DELETE
  USING (auth.uid() = user_id);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION public.update_image_ads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_image_ads_updated_at ON public.image_ads;
CREATE TRIGGER trigger_update_image_ads_updated_at
  BEFORE UPDATE ON public.image_ads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_image_ads_updated_at();
