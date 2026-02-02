-- 프로필 자동 생성 트리거
-- auth.users에 새 유저가 생성되면 public.profiles에 자동으로 프로필 생성
-- 실행: Supabase SQL Editor에서 직접 실행

-- 프로필 자동 생성 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, credits, is_onboarded, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    15,  -- DEFAULT_SIGNUP_CREDITS
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성 (이미 있으면 삭제 후 재생성)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
