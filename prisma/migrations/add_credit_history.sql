-- 크레딧 히스토리 테이블 마이그레이션
-- 사용자의 크레딧 사용/획득 내역을 추적

-- 트랜잭션 타입 ENUM 생성
DO $$ BEGIN
  CREATE TYPE credit_transaction_type AS ENUM (
    'USE',           -- 크레딧 사용
    'REFUND',        -- 환불 (생성 실패, NSFW 등)
    'SUBSCRIPTION',  -- 구독 크레딧 지급
    'SIGNUP',        -- 가입 크레딧
    'ADMIN'          -- 관리자 조정
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 기능 타입 ENUM 생성
DO $$ BEGIN
  CREATE TYPE credit_feature_type AS ENUM (
    'IMAGE_AD',           -- 이미지 광고 생성
    'IMAGE_EDIT',         -- 이미지 편집
    'VIDEO_PRODUCT_DESC', -- 제품 설명 영상
    'VIDEO_PRODUCT_AD',   -- 제품 광고 영상
    'KEYFRAME',           -- 키프레임 생성
    'TRANSITION',         -- 전환 영상
    'VIDU_SCENE',         -- Vidu Q3 씬 영상
    'MUSIC',              -- 음악 생성
    'OUTFIT',             -- 의상 교체
    'BACKGROUND'          -- 배경 생성
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 크레딧 히스토리 테이블 생성
CREATE TABLE IF NOT EXISTS credit_history (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_type  credit_transaction_type NOT NULL,
  feature_type      credit_feature_type,  -- USE/REFUND 시 필수
  amount            INTEGER NOT NULL,     -- 양수: 획득, 음수: 사용
  balance_after     INTEGER NOT NULL,     -- 트랜잭션 후 잔액
  related_entity_id UUID,                 -- 관련 리소스 ID (image_ads.id, video_ads.id 등)
  description       TEXT,                 -- 상세 설명 (옵션)
  created_at        TIMESTAMPTZ(6) DEFAULT NOW() NOT NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_credit_history_user_id ON credit_history(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_history_user_created ON credit_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_history_type ON credit_history(transaction_type);
CREATE INDEX IF NOT EXISTS idx_credit_history_feature ON credit_history(feature_type);

-- RLS 활성화
ALTER TABLE credit_history ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 히스토리만 조회 가능
CREATE POLICY "Users can view own credit history"
  ON credit_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS 정책: 서비스 롤만 INSERT 가능 (API에서만 생성)
CREATE POLICY "Service role can insert credit history"
  ON credit_history
  FOR INSERT
  WITH CHECK (true);

-- RLS 정책: 수정/삭제 불가 (감사 로그 성격)
-- DELETE, UPDATE 정책 없음 = 불가
