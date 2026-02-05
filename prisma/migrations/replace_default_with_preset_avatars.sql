-- default_avatars 테이블을 preset_avatars 테이블로 교체
-- preset_avatars는 avatars 테이블을 참조하여 FK 호환성 보장

-- 1. 기존 default_avatars 테이블 삭제
DROP TABLE IF EXISTS public.default_avatars CASCADE;

-- 2. avatars 테이블에 is_preset 컬럼 추가
ALTER TABLE public.avatars ADD COLUMN IF NOT EXISTS is_preset BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_avatars_is_preset ON public.avatars(is_preset);

-- 3. preset_avatars 테이블 생성 (avatars 테이블 참조)
CREATE TABLE IF NOT EXISTS public.preset_avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avatar_id UUID NOT NULL REFERENCES public.avatars(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(avatar_id)  -- 하나의 아바타는 하나의 프리셋만
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_preset_avatars_is_active ON public.preset_avatars(is_active);
CREATE INDEX IF NOT EXISTS idx_preset_avatars_display_order ON public.preset_avatars(display_order);
CREATE INDEX IF NOT EXISTS idx_preset_avatars_avatar_id ON public.preset_avatars(avatar_id);

-- RLS 활성화
ALTER TABLE public.preset_avatars ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽을 수 있는 정책 추가
DROP POLICY IF EXISTS preset_avatars_select_policy ON public.preset_avatars;
CREATE POLICY preset_avatars_select_policy ON public.preset_avatars
  FOR SELECT USING (true);

-- 관리자만 쓸 수 있는 정책 (service_role 또는 admin role)
DROP POLICY IF EXISTS preset_avatars_insert_policy ON public.preset_avatars;
CREATE POLICY preset_avatars_insert_policy ON public.preset_avatars
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

DROP POLICY IF EXISTS preset_avatars_update_policy ON public.preset_avatars;
CREATE POLICY preset_avatars_update_policy ON public.preset_avatars
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

DROP POLICY IF EXISTS preset_avatars_delete_policy ON public.preset_avatars;
CREATE POLICY preset_avatars_delete_policy ON public.preset_avatars
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );
