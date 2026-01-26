-- 구독 시스템 테이블 생성
-- plans, subscriptions, usage_tracking

-- plan_type enum
DO $$ BEGIN
    CREATE TYPE plan_type AS ENUM ('FREE', 'STARTER', 'PRO', 'BUSINESS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- subscription_status enum
DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'CANCELED', 'PAST_DUE', 'TRIALING');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- plans 테이블
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name plan_type UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    price_monthly INTEGER NOT NULL DEFAULT 0,
    price_yearly INTEGER NOT NULL DEFAULT 0,
    stripe_price_id_monthly TEXT,
    stripe_price_id_yearly TEXT,
    avatar_limit INTEGER NOT NULL DEFAULT 3,
    music_limit INTEGER NOT NULL DEFAULT 5,
    product_limit INTEGER NOT NULL DEFAULT 3,
    monthly_credits INTEGER NOT NULL DEFAULT 0,
    keyframe_count INTEGER NOT NULL DEFAULT 1,
    watermark_free BOOLEAN NOT NULL DEFAULT false,
    hd_upscale BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- subscriptions 테이블
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id),
    status subscription_status NOT NULL DEFAULT 'ACTIVE',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- usage_tracking 테이블
CREATE TABLE IF NOT EXISTS usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    period DATE NOT NULL,
    avatar_count INTEGER NOT NULL DEFAULT 0,
    music_count INTEGER NOT NULL DEFAULT 0,
    product_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, period)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_period ON usage_tracking(user_id, period);

-- RLS 정책
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- plans: 모든 사용자 읽기 가능
CREATE POLICY "Plans are viewable by everyone" ON plans
    FOR SELECT USING (true);

-- subscriptions: 본인 데이터만 접근
CREATE POLICY "Users can view own subscription" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- usage_tracking: 본인 데이터만 접근
CREATE POLICY "Users can view own usage" ON usage_tracking
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON usage_tracking
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON usage_tracking
    FOR UPDATE USING (auth.uid() = user_id);
