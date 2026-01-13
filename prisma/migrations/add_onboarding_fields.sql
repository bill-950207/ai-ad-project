-- profiles 테이블에 온보딩 관련 필드 추가
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_onboarded BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS team_size TEXT,
ADD COLUMN IF NOT EXISTS referral_source TEXT;

-- 기존 사용자들은 온보딩 완료 처리 (선택사항)
-- UPDATE public.profiles SET is_onboarded = true WHERE is_onboarded IS NULL;
