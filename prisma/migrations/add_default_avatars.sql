-- default_avatars 테이블 생성
CREATE TABLE IF NOT EXISTS public.default_avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  gender TEXT,
  age_group TEXT,
  style TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_default_avatars_is_active ON public.default_avatars(is_active);
CREATE INDEX IF NOT EXISTS idx_default_avatars_display_order ON public.default_avatars(display_order);

-- RLS 활성화
ALTER TABLE public.default_avatars ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽을 수 있는 정책 추가
DROP POLICY IF EXISTS default_avatars_select_policy ON public.default_avatars;
CREATE POLICY default_avatars_select_policy ON public.default_avatars
  FOR SELECT USING (true);

-- 기본 아바타 데이터 삽입
INSERT INTO public.default_avatars (name, description, image_url, gender, age_group, style, is_active, display_order)
VALUES
  (
    '소희',
    '밝고 활기찬 20대 여성 모델',
    'https://pub-ec68419ff8bc464ca734a0ddb80a2823.r2.dev/avatars/compressed/83f38675-7afc-4e39-bbc4-5894c286e342_1767847873252.webp',
    'female',
    '20s',
    'casual',
    true,
    1
  ),
  (
    '지훈',
    '세련된 30대 남성 모델',
    'https://pub-ec68419ff8bc464ca734a0ddb80a2823.r2.dev/avatars/compressed/6090e5f9-a46d-45f7-9c64-fb7e528f07fe_1767844019145.webp',
    'male',
    '30s',
    'professional',
    true,
    2
  )
ON CONFLICT (id) DO NOTHING;
