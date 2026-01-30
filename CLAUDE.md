# CLAUDE.md - AI Assistant Guide for AIAD

AIAD는 AI 서비스를 활용한 광고 콘텐츠(이미지, 영상, 아바타, 배경, 음악) 생성 SaaS 플랫폼입니다.

**Primary Language:** Korean | **Package:** `aiad`

## Technology Stack

- **Frontend:** Next.js 15.5.10 (App Router), React 19.2.4, Tailwind CSS 3.4.0, Lucide React 0.562.0
- **Backend:** Node.js, TypeScript 5.0.0, Prisma 7.2.0 (@prisma/adapter-pg), PostgreSQL
- **Auth:** Supabase (@supabase/ssr 0.8.0, @supabase/supabase-js 2.89.0)
- **Storage:** Cloudflare R2 (@aws-sdk/client-s3)
- **Payments:** Stripe (@stripe/stripe-js 8.6.4, stripe 20.2.0)
- **Media:** FFmpeg (fluent-ffmpeg), sharp 0.34.5
- **AI Services:** FAL.ai, Kie.ai, Google Gemini, ElevenLabs, WaveSpeed AI

## Codebase Structure

```
app/
├── (auth)/              # 로그인, 회원가입, 온보딩, 이메일 인증
├── (fullscreen)/        # 전체화면 에디터 (image-ad-create, video-ad-create)
├── dashboard/           # 보호된 대시보드
│   ├── avatar/          # 아바타 관리
│   ├── image-ad/        # 이미지 광고 생성/관리
│   ├── video-ad/        # 영상 광고 생성/관리
│   ├── ad-products/     # 제품 관리
│   ├── music/           # 음악 생성
│   ├── background/      # 배경 생성
│   ├── profile/         # 사용자 프로필
│   ├── settings/        # 설정
│   ├── subscription/    # 구독 관리
│   └── pricing/         # 요금제 페이지
├── api/                 # API 라우트 (96+ 엔드포인트)
├── pricing/             # 공개 요금제 페이지
└── legal/               # 약관, 개인정보처리방침

components/
├── dashboard/           # 대시보드 (사이드바, 갤러리)
├── avatar/              # 아바타 생성/관리
├── image-ad/            # 이미지 광고 위저드
├── video-ad/            # 영상 광고 위저드 (avatar-motion, product-ad)
├── ad-product/          # 제품 관리
├── landing/             # 랜딩 페이지
├── onboarding/          # 온보딩 위저드
├── subscription/        # 구독 UI
├── ui/                  # 공통 UI (모달, 버튼 등)
└── providers/           # Provider 래퍼

lib/
├── auth/                # 인증 헬퍼
├── avatar/              # 아바타 생성 유틸리티
├── credits/             # 크레딧 시스템 (constants, utils)
├── elevenlabs/          # ElevenLabs TTS 클라이언트
├── fal/                 # FAL.ai 이미지/영상 클라이언트
├── gemini/              # Google Gemini LLM (15+ 프롬프트 빌더)
├── hooks/               # 커스텀 React 훅
├── i18n/                # 국제화 (ko, en, ja)
├── image/               # 이미지 처리 유틸리티
├── image-ad/            # 이미지 광고 생성
├── kie/                 # Kie.ai API 클라이언트
├── prompts/             # AI 프롬프트 템플릿
├── storage/             # Cloudflare R2 파일 스토리지
├── stripe/              # Stripe 결제 통합
├── subscription/        # 구독 시스템
├── supabase/            # Supabase 클라이언트 (client, server, admin)
├── tts/                 # TTS 통합 서비스
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
└── seed*.ts             # 데이터 시딩
```

## Development Commands

```bash
npm run dev          # 개발 서버
npm run build        # 빌드 (Prisma generate 포함)
npm run db:generate  # Prisma 클라이언트 생성
npm run db:migrate   # DB 마이그레이션
npm run lint         # ESLint
```

## Git Worktree

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
feat: 새 기능 | fix: 버그 수정 | refactor: 리팩토링 | docs: 문서 | chore: 기타
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
- `profiles` - 사용자 프로필 (크레딧, 역할, 회사 정보)
- `subscriptions` - 사용자 구독
- `plans` - 요금제 정의 (FREE, STARTER, PRO, BUSINESS)
- `usage_tracking` - 월별 사용량 추적

**아바타 시스템:**
- `avatars` - 아바타 생성 데이터
- `default_avatars` - 서비스 제공 기본 아바타
- `avatar_outfits` - 의상 변환

**광고 자산:**
- `ad_products` - 제품 이미지 (배경 제거)
- `ad_showcases` - 관리자 등록 쇼케이스

**생성된 광고:**
- `image_ads` - 이미지 광고
- `video_ads` - 영상 광고 (멀티씬, 오디오, 씬 버전)
- `video_ad_scene_versions` - 씬 버전 히스토리
- `ad_music` - 배경 음악
- `ad_background` - 배경 이미지

### Status Enums
```
PENDING → IN_QUEUE → IN_PROGRESS → COMPLETED / FAILED
```
- 영상 광고 추가 상태: `DRAFT`, `GENERATING_SCENARIO`, `GENERATING_SCENES`, `GENERATING_VIDEO` 등

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
| 의상 변경 | 2 | Seedream 4.5 |
| 이미지 광고 (중화질) | 2 | |
| 이미지 광고 (고화질) | 3 | |
| 배경 이미지 | 1 | Z-Image |
| 제품설명 영상 (480p) | 5 | Hailuo + TTS |
| 제품설명 영상 (720p) | 10 | |
| 아바타 모션 (5초) | 40 | Kling 2.6 |
| 아바타 모션 (10초) | 60 | |
| 제품 광고 (seedance, 4초) | 8 | 해상도/길이별 |
| 제품 광고 (wan2.6, 5초) | 10 | |
| 키프레임 이미지 | 1 | Seedream 4.5 |
| 전환 영상 | 12 | Kling O1 |
| Vidu Q2 (540p/초) | 1 | 초당 |
| Vidu Q2 (720p/초) | 2 | |
| Vidu Q2 (1080p/초) | 3 | |
| 음악 생성 | 1 | Suno V5 |
| 배경 제거 | 0 | 무료 |
| 제품 등록 (한도 초과 시) | 1 | |
| 회원가입 크레딧 | 15 | FREE 요금제 기본 |

### 크레딧 부족 처리
```typescript
import { CreditUtils } from '@/lib/credits/utils'

// 크레딧 확인
const hasCredit = await CreditUtils.checkCredits(userId, requiredAmount)
if (!hasCredit) {
  return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
}
```

## Subscription System

### 요금제 (`lib/subscription/plans.ts`)
| 요금제 | 월 크레딧 | 아바타 | 음악 | 제품 | 키프레임 |
|--------|----------|--------|------|------|----------|
| FREE | 15 | 1 | 1 | 3 | 1 |
| STARTER | 100 | 3 | 5 | 10 | 1 |
| PRO | 300 | -1 (무제한) | -1 | -1 | 2 |
| BUSINESS | 1000 | -1 | -1 | -1 | 2 |

### 사용량 추적 (`lib/subscription/usage.ts`)
```typescript
import { UsageTracker } from '@/lib/subscription/usage'

// 사용량 체크
const canCreate = await UsageTracker.canCreateAvatar(userId)
// 사용량 증가
await UsageTracker.incrementAvatarCount(userId)
```

## AI Services

**중요:** 새 API 추가 전 기존 모델/함수 중복 확인 필요.

### 공급자별 기능
| 기능 | 주 공급자 | 대체 공급자 |
|------|----------|------------|
| 아바타 생성 | Kie.ai (Z-Image) | FAL.ai |
| 의상 교체 | Kie.ai (Seedream 4.5) | FAL.ai (Qwen Edit) |
| 이미지 광고 | Kie.ai (Seedream 4.5) | FAL.ai (GPT-Image 1.5) |
| 배경 제거 | Kie.ai (Recraft) | FAL.ai (Rembg) |
| 영상 생성 | Kie.ai (Kling 2.6, Wan 2.6) | FAL.ai (Vidu Q2, Kling O1) |
| TTS | WaveSpeed (Minimax) | ElevenLabs |
| 토킹 영상 | Kie.ai (Kling Avatar) | WaveSpeed (InfiniteTalk) |
| 음악 생성 | Kie.ai (Suno V5) | - |
| LLM | Google Gemini | - |

### Kie.ai (`lib/kie/client.ts`)
- Bearer 토큰 인증
- Task 기반 비동기 API (taskId 폴링)
- 모델: Z-Image, Seedream 4.5, Kling 2.6, Wan 2.6, Suno V5

### FAL.ai (`lib/fal/client.ts`)
- @fal-ai/client 패키지 사용
- 큐 기반 API (request ID 추적)
- 배치 요청 지원

### Google Gemini (`lib/gemini/`)
- 프롬프트 최적화 및 확장
- 레퍼런스 분석 (이미지, 영상)
- 시나리오 생성
- 추천 엔진

### TTS 통합 (`lib/tts/unified-service.ts`)
```typescript
// Primary: WaveSpeed Minimax (한국어 최적화)
// Fallback: ElevenLabs (다국어)
const audio = await unifiedTTS.generateSpeech(text, {
  language: 'ko',
  voiceId: 'voice-id',
  enableFallback: true
})
```

## API Routes Overview (96+)

### 주요 카테고리
- **사용자 & 인증:** `/api/me`, `/api/onboarding`
- **아바타:** `/api/avatars/*` (8 라우트)
- **제품:** `/api/ad-products/*` (9 라우트)
- **이미지 광고:** `/api/image-ads/*`, `/api/image-ad/*` (10+ 라우트)
- **영상 광고:** `/api/avatar-motion/*`, `/api/product-ad/*`, `/api/video-ads/*` (40+ 라우트)
- **음악:** `/api/ad-music/*` (6 라우트)
- **배경:** `/api/ad-backgrounds/*` (3 라우트)
- **음성:** `/api/voices`, `/api/minimax-voices/*`
- **구독 & 결제:** `/api/subscription`, `/api/stripe/*`
- **관리자:** `/api/admin/*`

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
| 404 | Not Found |
| 500 | Server Error |

## Draft System

이미지/영상 광고 생성 위저드의 자동 저장 기능:
```typescript
// 드래프트 저장
POST /api/image-ad/draft
{ wizard_state: { step, formData, ... } }

// 드래프트 불러오기
GET /api/image-ad/draft
{ draft: { wizard_state, updated_at } }
```

## i18n

Languages: `ko` (default), `en`, `ja`
```typescript
const { t, language, setLanguage } = useLanguage()
// t('key.nested.path')
```

## Environment Variables

주요 환경 변수 (`.env.example` 참조):
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database
DATABASE_URL=           # Prisma 연결
DIRECT_URL=            # 마이그레이션용 직접 연결

# AI Services
FAL_KEY=
KIE_KEY=
GOOGLE_AI_API_KEY=
WAVE_SPEED_AI_KEY=
ELEVENLABS_API_KEY=

# Storage
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
AVATAR_AI_PROVIDER=kie  # 'kie' | 'fal'
OUTFIT_AI_PROVIDER=kie
```

## Security

- Service role key는 클라이언트에 노출 금지
- 파일 업로드는 presigned URL 사용 (R2)
- 모든 사용자 입력 검증 필수
- API 라우트에서 항상 인증 확인

## Recent Features

최근 구현된 주요 기능들:
- **드래프트 시스템:** 이미지/영상 광고 자동 저장/복원
- **크레딧 시스템 v2:** 키프레임, Vidu Q2, 제품설명 영상 세분화
- **씬 버전 관리:** 멀티씬 영상 버전 히스토리
- **통합 업그레이드 모달:** 크레딧 부족 시 일관된 UX
- **쇼케이스 갤러리:** 관리자 큐레이션 예시 광고
- **DB 최적화:** 쿼리 성능 개선
- **R2 지연 초기화:** 스토리지 성능 개선

## Deprecated Features (사용 안 함)

다음 기능들은 현재 서비스에서 **사용하지 않음**:
- **아바타 모션:** `/api/avatar-motion/*`, `components/video-ad/avatar-motion/`
- **배경 생성:** `/api/ad-backgrounds/*`, `dashboard/background/`

해당 코드는 레거시로 유지되며, 신규 개발이나 버그 수정 대상이 아님.
