-- 구독 시스템 개선 마이그레이션
-- 1. subscriptions 테이블에 canceled_at 필드 추가 (Soft Delete 지원)
-- 2. webhook_events 테이블 생성 (멱등성 지원)

-- 1. subscriptions 테이블에 canceled_at 필드 추가
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;

COMMENT ON COLUMN public.subscriptions.canceled_at IS 'Soft delete용 취소 시간. 구독이 완전히 취소된 시점을 기록';

-- 2. webhook_events 테이블 생성 (Stripe Webhook 이벤트 중복 처리 방지)
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id TEXT PRIMARY KEY,                              -- Stripe 이벤트 ID (evt_xxx)
    event_type TEXT NOT NULL,                         -- 이벤트 타입 (checkout.session.completed 등)
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()   -- 처리 시간
);

-- 인덱스 생성 (오래된 이벤트 정리용)
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at
ON public.webhook_events (processed_at);

-- RLS 활성화 (서비스 역할만 접근 가능)
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 후 재생성
DROP POLICY IF EXISTS "webhook_events_service_only" ON public.webhook_events;

CREATE POLICY "webhook_events_service_only"
ON public.webhook_events
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE public.webhook_events IS 'Stripe Webhook 이벤트 중복 처리 방지용 테이블. 7일 이상 된 레코드는 자동 삭제됨.';
