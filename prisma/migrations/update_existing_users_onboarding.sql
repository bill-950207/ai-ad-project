-- 기존 사용자들은 온보딩 완료 처리
-- (이미 서비스를 사용하고 있던 사용자들이므로)
UPDATE public.profiles
SET is_onboarded = true
WHERE is_onboarded IS NULL OR is_onboarded = false;
