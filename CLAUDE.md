# CLAUDE.md - AI Assistant Guide for AIAD

AIAD는 AI 서비스를 활용한 광고 콘텐츠(이미지, 영상, 아바타, 음악) 생성 SaaS 플랫폼입니다.

**Primary Language:** Korean | **Package:** `aiad`

## Technology Stack

- **Frontend:** Next.js 15.5.10 (App Router), React 19.2.4, Tailwind CSS 3.4.0, Lucide React 0.562.0
- **Backend:** Node.js, TypeScript 5.0.0, Prisma 7.2.0 (@prisma/adapter-pg), PostgreSQL
- **Auth:** Supabase (@supabase/ssr 0.8.0, @supabase/supabase-js 2.89.0)
- **Storage:** Cloudflare R2 (@aws-sdk/client-s3 3.964.0)
- **Payments:** Stripe (@stripe/stripe-js 8.6.4, stripe 20.2.0)
- **Media:** FFmpeg (fluent-ffmpeg), sharp 0.34.5
- **AI Services:** FAL.ai, Kie.ai, Google Gemini (@google/genai 1.35.0), ElevenLabs, WaveSpeed AI
- **Monitoring:** Sentry (@sentry/nextjs 10.38.0)
- **DnD:** @dnd-kit (core, sortable, utilities)

## Codebase Structure

```
app/
├── (auth)/              # 로그인, 회원가입, 온보딩, 이메일 인증
├── (fullscreen)/        # 전체화면 에디터 (image-ad-create, video-ad-create)
├── [locale]/            # 다국어 라우팅 (ko, en, ja, zh)
├── auth/                # 인증 콜백 (callback)
├── dashboard/           # 보호된 대시보드
│   ├── avatar/          # 아바타 관리
│   ├── image-ad/        # 이미지 광고 생성/관리
│   ├── video-ad/        # 영상 광고 생성/관리
│   ├── ad-products/     # 제품 관리
│   ├── music/           # 음악 생성
│   ├── background/      # [미사용] 배경 생성
│   ├── profile/         # 사용자 프로필
│   ├── settings/        # 설정
│   ├── subscription/    # 구독 관리
│   ├── pricing/         # 요금제 페이지
│   └── admin/           # 관리자 페이지
├── api/                 # API 라우트 (87개 엔드포인트)
├── pricing/             # 공개 요금제 페이지
└── legal/               # 약관, 개인정보처리방침

components/
├── dashboard/           # 대시보드 (사이드바, 갤러리, 쇼케이스)
├── avatar/              # 아바타 생성/관리
├── image-ad/            # 이미지 광고 위저드
├── video-ad/            # 영상 광고 위저드 (product-ad, avatar-motion, product-description)
├── ad-product/          # 제품 관리
├── landing/             # 랜딩 페이지
├── onboarding/          # 온보딩 위저드
├── subscription/        # 구독 UI
├── admin/               # 관리자 UI
├── analytics/           # 분석 (Clarity, GA)
├── ui/                  # 공통 UI (모달, 버튼 등)
└── providers/           # Provider 래퍼

lib/
├── auth/                # 인증 헬퍼 (admin.ts, cached.ts)
├── avatar/              # 아바타 생성 유틸리티 (prompt-builder, option-labels)
├── cache/               # 데이터 캐싱 (user-data)
├── client/              # 클라이언트 업로드 유틸리티
├── credits/             # 크레딧 시스템 (constants, utils, history)
├── fal/                 # FAL.ai 이미지/영상 클라이언트
├── gemini/              # Google Gemini LLM (20+ 프롬프트 빌더)
├── generated/           # Prisma 생성 파일
├── hooks/               # 커스텀 React 훅 (use-async-draft-save, use-user-plan)
├── i18n/                # 국제화 (ko, en, ja, zh)
├── image/               # 이미지 처리 (compress, optimize, product-processor)
├── image-ad/            # 이미지 광고 생성
├── kie/                 # Kie.ai API 클라이언트 (TTS 포함)
├── prompts/             # AI 프롬프트 템플릿
├── storage/             # Cloudflare R2 파일 스토리지
├── stripe/              # Stripe 결제 통합
├── subscription/        # 구독 시스템 (슬롯 제한, 캐시, 쿼리)
├── supabase/            # Supabase 클라이언트 (client, server, admin)
├── tts/                 # TTS 모듈 (lib/kie/tts re-export)
├── video/               # 영상 처리 (FFmpeg)
└── wavespeed/           # WaveSpeed AI 클라이언트

contexts/                # React 컨텍스트 (credit-context)
types/                   # TypeScript 타입 정의

prisma/
├── schema.prisma        # DB 스키마
└── migrations/          # 마이그레이션

scripts/
├── worktree.sh          # Git 워크트리 관리
├── setup-worktree.sh    # 워크트리 초기화
├── run-migration.mjs    # DB 마이그레이션 실행
├── seed.ts              # 기본 데이터 시딩
├── seed-plans.ts        # 요금제 데이터 시딩
└── sync-translations.mjs # 번역 파일 동기화
```

## Development Commands

```bash
npm run dev          # 개발 서버
npm run build        # 빌드 (Prisma generate 포함)
npm run db:generate  # Prisma 클라이언트 생성
npm run db:migrate   # DB 마이그레이션
npm run db:seed      # 데이터 시딩
npm run lint         # ESLint
```

## Git Worktree

**중요:**
- Claude는 코드 수정 작업 시 main 브랜치에서 직접 작업하지 말고, 매 작업마다 새로운 브랜치를 생성하여 작업해야 합니다.
- 작업 단위로 커밋하세요. 하나의 커밋에 여러 기능을 섞지 마세요.

### 워크트리 관리 스크립트
```bash
./scripts/worktree.sh create <feature-name>  # 워크트리 + 브랜치 생성 + 초기 설정
./scripts/worktree.sh list                   # 현재 워크트리 목록
./scripts/worktree.sh status                 # 모든 워크트리 상태 확인
./scripts/worktree.sh remove <feature-name>  # 워크트리 제거
```

### Claude 워크트리 작업 가이드
Claude가 워크트리 관련 요청을 받으면:

1. **워크트리 생성 요청** (예: "user-auth 기능 워크트리 만들어줘")
   ```bash
   ./scripts/worktree.sh create user-auth
   ```
   - 자동으로 `feature/user-auth` 브랜치 생성
   - 워크트리 경로: `../ai_ad_project-user-auth`
   - npm install, .env 복사, prisma generate 자동 실행

2. **워크트리 목록 확인**
   ```bash
   ./scripts/worktree.sh list
   ```

3. **워크트리 제거**
   ```bash
   ./scripts/worktree.sh remove user-auth
   ```

### 브랜치 네이밍 규칙
- 기능: `feature/<name>` (예: feature/user-auth)
- 버그수정: `fix/<name>` (예: fix/login-error)
- 워크트리 경로: `../ai_ad_project-<name>`

### 수동 설정 (필요시)
```bash
git worktree add ../ai_ad_project-[feature] [branch]
cd ../ai_ad_project-[feature]
./scripts/setup-worktree.sh  # npm install + .env 복사 + db:generate
```

## Commit & PR Guidelines

### 커밋 메시지 형식
```
feat: 새 기능 | fix: 버그 수정 | refactor: 리팩토링 | docs: 문서 | chore: 기타 | perf: 성능 개선
```

### 브랜치 규칙
- Claude는 main에 직접 병합하지 않음
- PR 생성까지만 Claude 역할, 병합은 사용자가 수행

## Code Conventions

### TypeScript
- Strict mode, `@/` path alias, No implicit any

### API Route Pattern
```typescript
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await prisma.tableName.findMany({ where: { user_id: user.id } })
  return NextResponse.json({ data })
}
```

### Styling
- Tailwind CSS, `cn()` utility for class merging

## Database

- **ORM:** Prisma 7.2.0 + PostgreSQL
- **Connection:** DIRECT_URL 우선 사용 (마이그레이션용)

### Key Models
**사용자 & 프로필:**
- `profiles` - 사용자 프로필 (크레딧, 역할, 회사 정보, 알림 설정)
- `subscriptions` - 사용자 구독
- `plans` - 요금제 정의 (FREE, STARTER, PRO, BUSINESS)
- `usage_tracking` - 월별 사용량 추적
- `credit_history` - 크레딧 사용/획득 히스토리

**아바타 시스템:**
- `avatars` - 아바타 생성 데이터
- `default_avatars` - 서비스 제공 기본 아바타
- `avatar_outfits` - [미사용] 의상 변환

**광고 자산:**
- `ad_products` - 제품 이미지 (배경 제거, 셀링 포인트, 추가 사진)
- `ad_showcases` - 관리자 등록 쇼케이스 (제품/아바타 썸네일 포함)

**생성된 광고:**
- `image_ads` - 이미지 광고 (배치 생성 지원)
- `video_ads` - 영상 광고 (멀티씬, 오디오, 씬 버전, BGM)
- `video_ad_scene_versions` - 씬 버전 히스토리
- `ad_music` - 배경 음악
- `ad_background` - 배경 이미지

**캐싱:**
- `voice_previews` - TTS 음성 프리뷰 캐시
- `webhook_events` - Stripe 웹훅 중복 처리 방지

### Status Enums
```
PENDING → IN_QUEUE → IN_PROGRESS → COMPLETED / FAILED
```
- 이미지 광고 추가 상태: `DRAFT`, `UPLOADING`, `IMAGES_READY`
- 영상 광고 추가 상태: `DRAFT`, `GENERATING_SCENARIO`, `GENERATING_SCENES`, `SCENES_COMPLETED`, `GENERATING_VIDEO`, `GENERATING_SCENE_VIDEOS` 등

### 크레딧 트랜잭션
```typescript
await prisma.$transaction(async (tx) => {
  await tx.profiles.update({
    where: { id: user.id },
    data: { credits: { decrement: cost } }
  })
  return tx.avatars.create({ data: { ... } })
})
```

## Authentication

- Supabase Auth, `middleware.ts`에서 세션 자동 갱신
- Server: `lib/supabase/server.ts`
- Client: `lib/supabase/client.ts`
- Admin: `lib/supabase/admin.ts` (서비스 롤)
- Cached: `lib/auth/cached.ts` (React.cache로 RSC 중복 호출 제거)
- 사용자 역할: `MEMBER` (기본), `ADMIN`

### 보호된 라우트
- `/dashboard/*` 전체 인증 필요
- 공개 라우트: `/`, `/pricing`, `/legal/*`, `/(auth)/*`

## Credit System

### 크레딧 가격표 (`lib/credits/constants.ts`)
AI 서비스 비용 × 2.5배 마진 기준 (~$0.07/크레딧, 100원)

| 기능 | 크레딧 | 비고 |
|------|--------|------|
| 아바타 생성 | 0 | 무료 (사용자 유치) |
| 이미지 광고 (중화질) | 2 | Seedream 4.5 |
| 이미지 광고 (고화질) | 3 | Seedream 4.5 |
| 제품설명 영상 (480p) | 5 | Hailuo + TTS |
| 제품설명 영상 (720p) | 10 | Hailuo + TTS |
| 키프레임 이미지 | 1 | Seedream 4.5 (이미지당) |
| Vidu Q3 (540p/초) | 1 | 제품 광고 영상 (초당) |
| Vidu Q3 (720p/초) | 2 | 제품 광고 영상 (초당) |
| Vidu Q3 (1080p/초) | 3 | 제품 광고 영상 (초당) |
| 음악 생성 | 1 | Suno V5 |
| 배경 이미지 생성 | 1 | Z-Image |
| 의상 교체 | 2 | Seedream 4.5 |
| 배경 제거 | 0 | 무료 (Recraft) |
| 제품 등록 | 0 | 무료 (배경 제거 포함) |
| TTS 음성 | 0 | 무료 (영상 워크플로우 포함) |
| 회원가입 크레딧 | 15 | FREE 요금제 기본 |

### 크레딧 부족 처리
```typescript
import { hasEnoughCredits, validateCredits } from '@/lib/credits/utils'

// 간단한 확인
const hasCredit = await hasEnoughCredits(userId, requiredAmount)
if (!hasCredit) {
  return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
}

// 상세 정보 필요 시
const { isValid, currentCredits, requiredCredits } = await validateCredits(userId, amount)
```

### 크레딧 히스토리 기록
```typescript
import { recordCreditUsage, recordCreditRefund } from '@/lib/credits/history'

// 사용 기록
await recordCreditUsage(userId, 'IMAGE_AD', amount, balanceAfter, entityId)

// 환불 기록
await recordCreditRefund(userId, 'IMAGE_AD', amount, balanceAfter, entityId, '생성 실패')
```

## Subscription System

### 요금제 (DB `plans` 테이블)
| 요금제 | 월 크레딧 | 아바타 슬롯 | 음악 슬롯 | 제품 슬롯 | 키프레임 수 |
|--------|----------|-------------|----------|----------|-------------|
| FREE | 15 | 1 | 1 | 3 | 1 |
| STARTER | 100 | 3 | 5 | 10 | 1 |
| PRO | 300 | -1 (무제한) | -1 | -1 | 2 |
| BUSINESS | 1000 | -1 | -1 | -1 | 2 |

**참고:** 슬롯은 동시 보유 가능 개수 제한 (월간 생성 횟수가 아님)

### 슬롯 제한 확인 (`lib/subscription/usage.ts`)
```typescript
import { checkSlotLimit, getSlotSummary } from '@/lib/subscription/usage'

// 슬롯 여유 확인
const result = await checkSlotLimit(userId, 'avatar') // 'avatar' | 'music' | 'product'
if (!result.withinLimit) {
  return NextResponse.json({ error: 'Slot limit reached' }, { status: 403 })
}

// 전체 슬롯 사용량 조회
const summary = await getSlotSummary(userId)
// { avatars: { used, limit }, music: { used, limit }, products: { used, limit } }
```

## AI Services

**중요:** 새 API 추가 전 기존 모델/함수 중복 확인 필요.

### 공급자별 기능
| 기능 | 주 공급자 | 대체 공급자 |
|------|----------|------------|
| 아바타 생성 | Kie.ai (Z-Image) | FAL.ai |
| 이미지 광고 | Kie.ai (Seedream 4.5) | FAL.ai (GPT-Image 1.5) |
| 배경 제거 | Kie.ai (Recraft) | FAL.ai (Rembg) |
| 제품 광고 영상 | WaveSpeed (Vidu Q3) | - |
| 키프레임 이미지 | Kie.ai (Seedream 4.5) | - |
| TTS | WaveSpeed (Minimax) | ElevenLabs |
| 토킹 영상 | Kie.ai (Kling Avatar) | - |
| 음악 생성 | Kie.ai (Suno V5) | - |
| LLM | Google Gemini (gemini-2.0-flash-thinking) | - |

### Kie.ai (`lib/kie/client.ts`)
- Bearer 토큰 인증
- Task 기반 비동기 API (taskId 폴링)
- 모델: Z-Image, Seedream 4.5, Suno V5, Kling Avatar

### WaveSpeed AI (`lib/wavespeed/client.ts`)
- API Key 인증
- 큐 기반 비동기 API (requestId 폴링)
- 모델: Vidu Q3 (제품 광고 영상, 1-16초), Minimax TTS
- **주의:** WaveSpeed는 queue_position 미지원

### FAL.ai (`lib/fal/client.ts`)
- @fal-ai/client 패키지 사용
- 큐 기반 API (request ID 추적)
- 배치 요청 지원

### Google Gemini (`lib/gemini/`)
- Lazy Initialization으로 Cold Start 최적화
- ThinkingLevel: LOW (모든 요청에 적용)
- 프롬프트 최적화 및 확장
- 레퍼런스 분석 (이미지, 영상)
- 시나리오 생성 (멀티씬, 싱글씬)
- 추천 엔진
- InfiniteTalk 프롬프트 생성

### TTS (`lib/tts/index.ts` → `lib/kie/tts.ts`)
```typescript
import { textToSpeech, getVoicesByLanguage, VOICES } from '@/lib/tts'

// 음성 목록 조회
const koreanVoices = getVoicesByLanguage('ko')

// TTS 생성 (Kie.ai ElevenLabs v3)
const result = await textToSpeech({
  text: '안녕하세요',
  voiceId: 'voice-id',
})
// { audioUrl: string, duration: number }
```

## API Routes Overview (87개)

### 주요 카테고리
- **사용자 & 인증:** `/api/me`, `/api/onboarding`, `/api/settings/*`
- **아바타:** `/api/avatars/*` (8 라우트)
- **제품:** `/api/ad-products/*` (9 라우트)
- **이미지 광고:** `/api/image-ads/*`, `/api/image-ad/*` (10+ 라우트)
- **영상 광고:** `/api/product-ad/*`, `/api/video-ads/*` (30+ 라우트)
- **음악:** `/api/ad-music/*` (6 라우트)
- **음성:** `/api/voices`, `/api/minimax-voices/*`
- **쇼케이스:** `/api/showcases`
- **구독 & 결제:** `/api/subscription`, `/api/stripe/*`, `/api/user/plan`
- **관리자:** `/api/admin/*`
- **크론:** `/api/cron/monthly-credits`

### 비동기 작업 상태 확인
대부분의 AI 생성 작업은 비동기로 처리:
```typescript
// 작업 제출 → requestId 반환
const { requestId } = await submitJob(...)

// 상태 폴링
const status = await fetch(`/api/*/status/${requestId}`)
// { status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED', result?: ... }
```

## API Response Patterns

```typescript
// 성공
{ data: ... }
{ success: true, data: ... }

// 에러
{ error: "에러 메시지" }

// 페이지네이션
{
  items: [...],
  pagination: { page, pageSize, totalCount, totalPages, hasMore }
}
```

### HTTP Status Codes
| 코드 | 의미 |
|------|------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 402 | Insufficient Credits |
| 403 | Slot Limit Reached |
| 404 | Not Found |
| 500 | Server Error |

## Draft System

이미지/영상 광고 생성 위저드의 자동 저장 기능:
```typescript
// 드래프트 저장 (useAsyncDraftSave 훅 사용)
POST /api/image-ad/draft
{ wizard_state: { step, formData, ... } }

// 드래프트 불러오기 (캐시 적용)
GET /api/image-ad/draft
{ draft: { wizard_state, updated_at } }
```

## i18n

Languages: `ko` (default), `en`, `ja`, `zh`
```typescript
const { t, language, setLanguage } = useLanguage()
// t('key.nested.path')
```

번역 파일: `lib/i18n/translations/{ko,en,ja,zh}.json`

## Environment Variables

주요 환경 변수 (`.env.example` 참조):
```bash
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase (NEXT_PUBLIC_ 접두사 없음)
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database
DATABASE_URL=           # Prisma 연결 (pooled)
DIRECT_URL=            # 마이그레이션용 직접 연결

# AI Services
FAL_KEY=
KIE_KEY=
GOOGLE_AI_API_KEY=
WAVE_SPEED_AI_KEY=
ELEVENLABS_API_KEY=

# Storage (Cloudflare R2)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_*_PRICE_ID=     # 요금제별 가격 ID

# AI Provider 선택
AVATAR_AI_PROVIDER=kie   # 'kie' | 'fal'
OUTFIT_AI_PROVIDER=kie   # 'kie' | 'fal'

# Analytics (Optional)
NEXT_PUBLIC_CLARITY_ID=
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_SENTRY_DSN=
```

## Storage (Cloudflare R2)

### 이미지 업로드 패턴
1. **Presigned URL 필수:** 클라이언트에서 직접 R2로 업로드 시 presigned URL 사용
2. **WebP 압축:** 원본 이미지와 WebP 압축본을 병렬로 업로드
3. **이중 URL 저장:** DB에 원본 URL과 WebP URL 모두 저장
4. **프론트엔드 조회:** 이미지 표시 시 WebP 압축본 우선 사용

### 파일 경로 규칙
- 아바타: `avatars/{userId}/{filename}`
- 제품: `products/{userId}/{filename}`
- 광고: `ads/{userId}/{type}/{filename}`

## Security

- Service role key는 클라이언트에 노출 금지
- 파일 업로드는 presigned URL 사용 (R2)
- 모든 사용자 입력 검증 필수
- API 라우트에서 항상 인증 확인

## Performance Optimizations

최근 적용된 성능 최적화:
- **Gemini 클라이언트 Lazy Initialization:** Cold Start 시간 단축
- **Gemini ThinkingLevel LOW:** 응답 속도 개선
- **React.cache():** RSC 요청 중복 인증 호출 제거
- **API 라우트 캐싱:** 자주 호출되는 엔드포인트 최적화
- **R2 지연 초기화:** 스토리지 성능 개선
- **드래프트 캐시 개선:** 위저드 상태 복원 속도 향상
- **대시보드 서버 프리페칭:** 로딩 시간 단축

## Recent Features

최근 구현된 주요 기능들:
- **대시보드 쇼케이스:** 제품/아바타 썸네일 표시
- **개별 쇼케이스 이미지 최적화:** 썸네일 생성 기능
- **Vidu Q3 전용 모드:** 제품 광고 영상 생성을 Vidu Q3 단일 모델로 통합 (1-16초 지원)
- **드래프트 시스템:** 이미지/영상 광고 자동 저장/복원
- **크레딧 히스토리:** 사용/획득 내역 추적
- **씬 버전 관리:** 멀티씬 영상 버전 히스토리
- **통합 업그레이드 모달:** 크레딧 부족 시 일관된 UX
- **쇼케이스 갤러리:** 관리자 큐레이션 예시 광고
- **Google 로그인 계정 선택:** 로그인 시 계정 선택 화면 표시
- **중국어(zh) 지원:** 다국어 지원 확장

## Deprecated Features (사용 안 함)

다음 기능들은 현재 서비스에서 **사용하지 않음**:
- **아바타 모션:** `/api/avatar-motion/*`, `components/video-ad/avatar-motion/`
- **아바타 의상 변경:** `/api/avatars/*/outfits/*`, `avatar_outfits` 테이블
- **배경 생성:** `/api/ad-backgrounds/*`, `dashboard/background/`
- **레거시 영상 모델:** Seedance, Kling 2.6, Wan 2.6, Kling O1, Vidu Q2 (제품 광고는 Vidu Q3 전용)
- **일반 모드 영상 생성:** `/api/product-ad/generate-video` (멀티씬 모드만 사용)
- **Kie.ai InfiniteTalk:** WaveSpeed 대체

해당 코드는 레거시로 유지되며, 신규 개발이나 버그 수정 대상이 아님.
