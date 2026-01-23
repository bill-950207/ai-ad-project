# CLAUDE.md - AI Assistant Guide for AIAD

This document provides comprehensive guidance for AI assistants working with the AIAD (AI-Powered Ad Content Generator) codebase.

## Project Overview

AIAD is a full-stack web application that generates advertising content (images, videos, avatars, backgrounds, and music) using multiple AI services. Built with Next.js 14 (App Router), it provides a SaaS platform for marketing content creation.

**Primary Language:** Korean (with English and Japanese support)
**Package Name:** `aiad`

## Technology Stack

### Frontend
- **Framework:** Next.js 14.2.0 (App Router with TypeScript)
- **UI:** React 18.3.0 with Tailwind CSS 3.4.0
- **Icons:** Lucide React
- **Utilities:** clsx, tailwind-merge

### Backend
- **Runtime:** Node.js with TypeScript 5.0.0
- **ORM:** Prisma 7.2.0 with PostgreSQL adapter
- **Auth:** Supabase (@supabase/ssr, @supabase/supabase-js)

### AI Services
| Service | Purpose | Models/APIs |
|---------|---------|-------------|
| FAL.ai | Image & video generation | z-image/turbo, Seedream 4.5 Edit, KLING |
| Kie.ai | Alternative image/video | Z-Image, GPT-Image 1.5, KLING O1/Vidu Q2 |
| Google Gemini | LLM for prompts/analysis | gemini-3-flash-preview |
| ElevenLabs | TTS (primary) | eleven_multilingual_v2 |
| WaveSpeed AI | TTS (fallback) | Minimax Speech 2.6 HD |
| FFmpeg | Local video processing | - |

### Storage
- **Cloud Storage:** Cloudflare R2 (S3-compatible)
- **Database:** PostgreSQL via Supabase

## Codebase Structure

```
/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth group (login, signup, onboarding)
│   ├── (fullscreen)/        # Fullscreen modal routes
│   ├── dashboard/           # Protected dashboard routes
│   │   ├── avatar/          # Avatar management
│   │   ├── image-ad/        # Image ad creation
│   │   ├── video-ad/        # Video ad creation
│   │   ├── ad-products/     # Product management
│   │   ├── music/           # Music library
│   │   └── background/      # Background library
│   ├── api/                 # API routes (66+ endpoints)
│   │   ├── avatars/         # Avatar CRUD & generation
│   │   ├── image-ads/       # Image ad generation
│   │   ├── video-ads/       # Video ad generation
│   │   ├── product-ad/      # Multi-scene product videos
│   │   ├── avatar-motion/   # Avatar motion videos
│   │   ├── ad-products/     # Product image management
│   │   ├── ad-music/        # Music generation
│   │   ├── ad-backgrounds/  # Background generation
│   │   └── voices/          # TTS voice endpoints
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── dashboard/           # Dashboard components
│   ├── video-ad/            # Video ad wizard components
│   ├── image-ad/            # Image ad components
│   ├── ad-product/          # Product components
│   ├── providers/           # Context providers
│   └── ui/                  # Shared UI components
├── lib/                     # Core business logic
│   ├── fal/client.ts        # FAL.ai integration
│   ├── gemini/client.ts     # Google Gemini integration
│   ├── kie/client.ts        # Kie.ai integration
│   ├── storage/r2.ts        # Cloudflare R2 storage
│   ├── supabase/            # Supabase clients (client, server, admin)
│   ├── tts/                 # Text-to-speech services
│   ├── prompts/             # AI prompt templates
│   ├── avatar/              # Avatar generation utilities
│   ├── image/               # Image processing
│   ├── video/               # Video processing with FFmpeg
│   ├── i18n/                # Internationalization
│   ├── db.ts                # Prisma database client
│   └── utils.ts             # Common utilities
├── contexts/                # React contexts
│   └── language-context.tsx # i18n language management
├── types/                   # TypeScript type definitions
├── prisma/                  # Database schema & migrations
│   ├── schema.prisma        # Database schema
│   └── migrations/          # SQL migrations
├── scripts/                 # Build & migration scripts
└── middleware.ts            # Supabase auth middleware
```

## Key Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies and npm scripts |
| `next.config.mjs` | Next.js configuration (image optimization) |
| `tsconfig.json` | TypeScript config (strict mode, `@/*` path alias) |
| `tailwind.config.ts` | Tailwind with CSS variables theme |
| `.eslintrc.json` | ESLint (warnings for unused vars, React rules) |
| `prisma.config.ts` | Prisma configuration |
| `middleware.ts` | Supabase session middleware |

## Development Commands

```bash
# Development
npm run dev          # Start development server

# Build
npm run build        # Generate Prisma client + Next.js build

# Database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations

# Linting
npm run lint         # Run ESLint
```

## Git Worktree Setup

이 프로젝트는 여러 워크트리에서 병렬 작업을 지원합니다.

### 워크트리 목록
```bash
git worktree list
```

### 새 워크트리 설정 (필수)
새 워크트리에서 작업 시작 전 반드시 초기 설정이 필요합니다:

```bash
./scripts/setup-worktree.sh
```

또는 수동으로:
```bash
npm install
cp /Users/bill/Desktop/projects/ai_ad_project/.env .
npm run db:generate
```

### Claude Code 자동 확인
**새 세션 시작 시 반드시 확인:**
1. 현재 디렉토리가 워크트리인지 확인 (`git worktree list`)
2. `node_modules` 존재 여부 확인
3. `.env` 파일 존재 여부 확인
4. `lib/generated/prisma/client` 존재 여부 확인

위 항목 중 하나라도 없으면 `./scripts/setup-worktree.sh` 실행을 제안하세요.

## Code Conventions

### TypeScript
- **Strict mode enabled** - All code must pass strict type checking
- **Path alias:** Use `@/` for imports from project root
- **No implicit any** - Explicitly type all parameters and returns

### File Structure
- API routes: `app/api/[feature]/route.ts`
- Dynamic routes: `app/api/[feature]/[id]/route.ts`
- Components: Feature-based organization under `components/`
- Utilities: Shared code under `lib/`

### API Route Pattern
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // 1. Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Business logic with Prisma
    const data = await prisma.tableName.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error description:', error)
    return NextResponse.json({ error: 'Error message' }, { status: 500 })
  }
}
```

### Documentation Style
- **Korean comments** for business logic explanation
- **JSDoc style** for function documentation
- API routes include header comments describing endpoints

### Component Pattern
```typescript
'use client'  // Client components when needed

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface ComponentProps {
  // Props interface
}

export function ComponentName({ prop }: ComponentProps) {
  // Component implementation
}
```

### CSS/Styling
- Use `cn()` utility for conditional class merging
- Tailwind CSS for all styling
- CSS variables defined in `tailwind.config.ts` for theming

## Database

### Connection (`lib/db.ts`)
- **ORM:** Prisma 7.2.0 with PostgreSQL adapter
- **Database:** PostgreSQL via Supabase
- **Adapter:** `@prisma/adapter-pg` with `pg.Pool`
- **Connection:** DIRECT_URL 우선 사용 (pooler URL 미지원)
- **Pooling:** max 10 connections, 30s idle timeout, 5s connection timeout
- **Pattern:** Singleton with hot-reload support

```typescript
import { prisma } from '@/lib/db'

// 조회
const avatars = await prisma.avatars.findMany({
  where: { user_id: userId },
  orderBy: { created_at: 'desc' },
})

// 생성
const avatar = await prisma.avatars.create({
  data: { user_id: userId, name: 'New Avatar', status: 'PENDING' },
})

// 트랜잭션 (크레딧 차감 + 생성)
await prisma.$transaction(async (tx) => {
  await tx.profiles.update({
    where: { id: userId },
    data: { credits: { decrement: 1 } },
  })
  return tx.avatars.create({ data: { ... } })
})
```

### Key Models
| Model | Purpose |
|-------|---------|
| `profiles` | User data, credits (default: 5), company info |
| `avatars` | User-created AI avatars |
| `avatar_outfits` | Avatar clothing variations |
| `ad_products` | Background-removed product images |
| `image_ads` | Generated image advertisements |
| `video_ads` | Generated video advertisements |
| `ad_music` | AI-generated background music |
| `ad_background` | Generated background images |

### Status Enums
Most content models use status tracking:
- `PENDING` - Initial state
- `IN_QUEUE` - Submitted to AI service
- `PROCESSING` - Being generated
- `COMPLETED` - Successfully generated
- `FAILED` - Generation failed

### Transactions
Use Prisma transactions for operations involving credits:
```typescript
await prisma.$transaction(async (tx) => {
  await tx.profiles.update({
    where: { id: user.id },
    data: { credits: { decrement: 1 } },
  })
  return tx.avatars.create({ data: { ... } })
})
```

## Authentication

- **Provider:** Supabase Auth
- **Middleware:** `middleware.ts` refreshes sessions automatically
- **Server client:** `lib/supabase/server.ts` for API routes
- **Browser client:** `lib/supabase/client.ts` for client components

### Protected Routes
Dashboard routes require authentication. Check pattern:
```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

## AI Service Integration

**중요:** 새로운 API를 추가하기 전에 아래 목록을 확인하여 동일한 모델에 연결하는 중복 API를 생성하지 않도록 주의하세요.

### FAL.ai (`lib/fal/client.ts`)

| 모델 ID | 용도 | 함수 |
|---------|------|------|
| `fal-ai/z-image/turbo` | 아바타 이미지 생성 | `submitToQueue()` |
| `fal-ai/qwen-image-edit-2511/lora` | 의상 교체 (LoRA) | `submitOutfitChangeToQueue()` |
| `smoretalk-ai/rembg-enhance` | 배경 제거 | `submitRembgToQueue()` |
| `fal-ai/gpt-image-1.5/edit` | 이미지 광고 생성 (참조 이미지 포함) | `submitImageAdToQueue()` |
| `fal-ai/gpt-image-1.5` | 이미지 생성 (프롬프트만) | `submitGptImageGenerateToQueue()` |
| `wan/v2.6/image-to-video` | 영상 광고 생성 | `submitVideoAdToQueue()` |
| `fal-ai/bytedance/seedance/v1.5/pro/image-to-video` | UGC 영상 생성 (오디오 포함) | `submitSeedanceToQueue()` |
| `fal-ai/bytedance/seedream/v4.5/edit` | 이미지 편집/합성, 첫 프레임 생성 | `submitSeedreamEditToQueue()` |
| `fal-ai/kling-video/o1/standard/image-to-video` | 씬 전환 영상 (시작/끝 프레임) | `submitKlingO1ToQueue()` |
| `fal-ai/vidu/q2/image-to-video/turbo` | 씬별 영상 생성 | `submitViduQ2ToQueue()` |

### Kie.ai (`lib/kie/client.ts`)

| 모델 ID | 용도 | 함수 |
|---------|------|------|
| `recraft/remove-background` | 배경 제거 | `createRembgTask()`, `submitRembgToQueue()` |
| `z-image` | 아바타/배경 이미지 생성 | `submitZImageToQueue()`, `submitZImageTurboToQueue()` |
| `seedream/4.5-edit` | 의상 교체, 이미지 편집, 첫 프레임 생성 | `submitOutfitEditToQueue()`, `submitFirstFrameToQueue()`, `submitImageAdToQueue()` |
| `gpt-image/1.5-image-to-image` | 참조 이미지 기반 이미지 생성 | `submitGPTImageToQueue()` |
| `kling/v1-avatar-standard` | 립싱크 토킹 영상 | `submitTalkingVideoToQueue()` |
| `suno/V5` | AI 음악 생성 | `submitAdMusicToQueue()` |
| `bytedance/seedream-v4-text-to-image` | 텍스트-이미지 생성 | `submitSeedreamV4ToQueue()` |
| `bytedance/seedance-1.5-pro` | 프레임 보간 영상 | `submitSeedanceToQueue()` |
| `kling-2.6/image-to-video` | 아바타 모션 영상 | `submitKling26ToQueue()` |
| `wan/2-6-image-to-video` | 영상 생성 | `submitWan26ToQueue()` |

### WaveSpeed AI (`lib/wavespeed/client.ts`)

| 모델/서비스 | 용도 | 함수 |
|-------------|------|------|
| `minimax/speech-2.6-hd` | TTS 음성 합성 | `textToSpeech()`, `submitTTSTask()` |
| `wavespeed-ai/infinitetalk` | 토킹 아바타 영상 | `submitInfiniteTalkToQueue()` |
| `vidu/image-to-video-q2-turbo` | 영상 생성 | `submitViduToQueue()` |

### Google Gemini (`lib/gemini/client.ts`)

| 모델 ID | 용도 |
|---------|------|
| `gemini-3-flash-preview` | 프롬프트 생성, URL 제품 정보 추출, 스크립트 작성, 이미지 분석 |

### ElevenLabs (`lib/elevenlabs/client.ts`)

| 모델 ID | 용도 |
|---------|------|
| `eleven_multilingual_v2` | 다국어 TTS 음성 합성 |

### 통합 TTS (`lib/tts/unified-service.ts`)

자동 Fallback 지원:
- **Primary:** WaveSpeed Minimax (한국어 최적화)
- **Fallback:** ElevenLabs (다국어)

```typescript
import { generateSpeech } from '@/lib/tts/unified-service'

const result = await generateSpeech({
  text: '안녕하세요',
  voiceId: 'Korean_SweetGirl',
  language: 'ko',
})
```

### 공급자별 용도 정리

| 기능 | 주 공급자 | 대체 공급자 |
|------|----------|------------|
| 아바타 생성 | Kie.ai (Z-Image) | FAL.ai (Z-Image Turbo) |
| 의상 교체 | Kie.ai (Seedream 4.5) | FAL.ai (Qwen Edit) |
| 이미지 광고 | Kie.ai (Seedream 4.5) | FAL.ai (GPT-Image 1.5) |
| 배경 제거 | Kie.ai (Recraft) | FAL.ai (Rembg) |
| 영상 생성 | Kie.ai (Kling 2.6, Wan 2.6) | FAL.ai (Vidu Q2, Kling O1) |
| TTS | WaveSpeed (Minimax) | ElevenLabs |
| 토킹 영상 | Kie.ai (Kling Avatar) | WaveSpeed (InfiniteTalk) |
| 음악 생성 | Kie.ai (Suno V5) | - |
| LLM | Google Gemini | - |

## API Endpoints Reference

총 65개 이상의 API 엔드포인트가 12개 기능 영역에 걸쳐 있습니다.

### Avatars (아바타)

| Endpoint | Method | 설명 |
|----------|--------|------|
| `/api/avatars` | GET | 사용자 아바타 목록 조회 |
| `/api/avatars` | POST | 새 아바타 생성 (AI 생성) |
| `/api/avatars/[id]` | GET | 특정 아바타 상세 조회 |
| `/api/avatars/[id]` | DELETE | 아바타 삭제 |
| `/api/avatars/[id]/status` | GET | 생성 상태 확인 |
| `/api/avatars/[id]/complete` | POST | 업로드 완료 표시 |
| `/api/avatars/[id]/upload-url` | POST | Presigned URL 생성 |
| `/api/avatars/[id]/outfits` | GET/POST | 의상 변형 관리 |
| `/api/avatars/[id]/outfits/[outfitId]/status` | GET | 의상 생성 상태 |

### Image Ads (이미지 광고)

| Endpoint | Method | 설명 |
|----------|--------|------|
| `/api/image-ads` | GET | 이미지 광고 목록 (페이지네이션) |
| `/api/image-ads` | POST | 새 이미지 광고 생성 (Seedream 4.5 Edit) |
| `/api/image-ads/[id]` | GET/DELETE | 이미지 광고 조회/삭제 |
| `/api/image-ads/[id]/retry` | POST | 실패한 광고 재시도 |
| `/api/image-ads/[id]/refund` | POST | 크레딧 환불 |
| `/api/image-ads/status/[requestId]` | GET | 생성 상태 확인 |
| `/api/image-ads/batch-status/[imageAdId]` | GET | 배치 진행 상황 |
| `/api/image-ads/analyze-reference` | POST | 참조 이미지 스타일 분석 |
| `/api/image-ads/recommend-options` | POST | AI 추천 옵션 |

**광고 유형:** `productOnly`, `holding`, `using`, `wearing`, `beforeAfter`, `lifestyle`, `unboxing`, `comparison`, `seasonal`

### Video Ads (비디오 광고)

| Endpoint | Method | 설명 |
|----------|--------|------|
| `/api/video-ads` | GET | 비디오 광고 목록 |
| `/api/video-ads` | POST | 새 비디오 광고 생성 |
| `/api/video-ads/[id]` | GET/PATCH/DELETE | 비디오 광고 관리 |
| `/api/video-ads/draft` | GET/POST/DELETE | 임시 저장 관리 |
| `/api/video-ads/status/[requestId]` | GET | 생성 상태 (image/video/auto) |
| `/api/video-ads/generate-prompt` | POST | Gemini로 프롬프트 생성 |
| `/api/video-ads/extract-url` | POST | URL에서 제품 정보 추출 |

**시간:** 5, 10, 15초 / **해상도:** 720p, 1080p

### Product Ads (제품 광고 - 멀티씬)

| Endpoint | Method | 설명 |
|----------|--------|------|
| `/api/product-ad/generate-multi-scene` | POST | 멀티씬 프롬프트 생성 (Vidu Q2) |
| `/api/product-ad/status/[requestId]` | GET | 생성 상태 (image/video) |
| `/api/product-ad/draft` | GET/POST | 임시 저장 |
| `/api/product-ad/generate-scenario` | POST | 시나리오/키프레임 생성 |
| `/api/product-ad/generate-scenes` | POST | 개별 씬 비디오 생성 |

### Ad Products (광고 제품 - 배경 제거)

| Endpoint | Method | 설명 |
|----------|--------|------|
| `/api/ad-products` | GET | 제품 목록 |
| `/api/ad-products` | POST | 새 제품 생성 (rembg 배경 제거) |
| `/api/ad-products/[id]` | GET/DELETE | 제품 조회/삭제 |
| `/api/ad-products/[id]/upload-url` | POST | 업로드 URL 생성 |
| `/api/ad-products/[id]/status` | GET | 처리 상태 |
| `/api/ad-products/[id]/process` | POST | rembg 처리 요청 |
| `/api/ad-products/[id]/retry` | POST | 재시도 |
| `/api/ad-products/extract-url` | POST | URL에서 제품 정보 추출 |

### Ad Music (AI 음악)

| Endpoint | Method | 설명 |
|----------|--------|------|
| `/api/ad-music` | GET | 음악 목록 |
| `/api/ad-music` | POST | 음악 생성 요청 (KIE V5) |
| `/api/ad-music/[id]` | GET/DELETE | 음악 조회/삭제 |
| `/api/ad-music/[id]/status` | GET | 생성 상태 |
| `/api/ad-music/callback` | POST | KIE 웹훅 콜백 |
| `/api/ad-music/recommend` | POST | AI 음악 추천 |

### Ad Backgrounds (AI 배경)

| Endpoint | Method | 설명 |
|----------|--------|------|
| `/api/ad-backgrounds` | GET | 배경 목록 |
| `/api/ad-backgrounds` | POST | 배경 생성 (KIE Z-Image) |
| `/api/ad-backgrounds/[id]` | GET/DELETE | 배경 조회/삭제 |
| `/api/ad-backgrounds/[id]/status` | GET | 생성 상태 |

**비율:** `16:9`, `9:16`, `1:1`, `4:3`, `3:4`

### Voices (음성)

| Endpoint | Method | 설명 |
|----------|--------|------|
| `/api/voices` | GET | ElevenLabs 음성 목록 |
| `/api/minimax-voices` | GET | WaveSpeed 음성 목록 |
| `/api/minimax-voices/preview` | GET | 음성 미리듣기 |

### Avatar Motion (아바타 모션)

| Endpoint | Method | 설명 |
|----------|--------|------|
| `/api/avatar-motion` | GET | 아바타 모션 비디오 목록 |
| `/api/avatar-motion/status/[requestId]` | GET | 생성 상태 (frame/video) |
| `/api/avatar-motion/draft` | GET/POST/DELETE | 임시 저장 |
| `/api/avatar-motion/generate-story` | POST | 스토리 생성 |
| `/api/avatar-motion/generate-scenes` | POST | 씬 생성 |

### General (일반)

| Endpoint | Method | 설명 |
|----------|--------|------|
| `/api/upload` | POST | R2에 이미지 업로드 |
| `/api/onboarding` | GET/POST | 온보딩 상태/완료 |

### 크레딧 시스템

| 기능 | 크레딧 |
|------|--------|
| 아바타 생성 | 1 |
| 이미지 광고 (medium) | 2/이미지 |
| 이미지 광고 (high) | 3/이미지 |
| 의상 변경 | 2 |

### 공통 응답 패턴

```typescript
// 성공
{ data: ... }
{ success: true, data: ... }

// 에러
{ error: "메시지" }

// 페이지네이션
{
  items: [...],
  pagination: {
    page: 1,
    pageSize: 20,
    totalCount: 100,
    totalPages: 5,
    hasMore: true
  }
}
```

## File Storage

### Cloudflare R2 (lib/storage/r2.ts)
- S3-compatible storage
- Presigned URLs for secure uploads
- Used for all user-generated content

## Internationalization

### Supported Languages
- Korean (`ko`) - Default
- English (`en`)
- Japanese (`ja`)

### Usage
```typescript
import { useLanguage } from '@/contexts/language-context'

const { t, language, setLanguage } = useLanguage()
// t('key') returns translated string
```

### Translation Files
Located in `lib/i18n/translations/`:
- `ko.json`
- `en.json`
- `ja.json`

## Environment Variables

Required environment variables (create `.env.local`):

```bash
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database
DATABASE_URL=
DIRECT_URL=

# AI Services
FAL_KEY=
KIE_API_KEY=
GOOGLE_GEMINI_API_KEY=
ELEVENLABS_API_KEY=

# Storage (Cloudflare R2)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=

# Optional
AVATAR_AI_PROVIDER=kie  # or 'fal'
```

## Common Tasks

### Adding a New API Endpoint
1. Create route file: `app/api/[feature]/route.ts`
2. Add Korean documentation header
3. Implement auth check, business logic, error handling
4. Update relevant Prisma model if needed

### Adding a New Component
1. Create in appropriate `components/` subfolder
2. Use TypeScript interfaces for props
3. Use `cn()` for class merging
4. Add to index if creating a component library

### Adding a New AI Feature
1. Create client in `lib/[service]/client.ts`
2. Add prompt templates in `lib/prompts/`
3. Create API route for the feature
4. Add database model for tracking status/results

### Modifying Database Schema
1. Update `prisma/schema.prisma`
2. Run `npm run db:generate` to update client
3. Create migration if needed

## Error Handling

- API routes should catch all errors and return appropriate status codes
- Use console.error for server-side logging (Korean descriptions)
- Return generic error messages to clients

### Standard HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `402` - Payment Required (insufficient credits)
- `404` - Not Found
- `500` - Internal Server Error

## Testing

Currently no automated tests configured. When adding tests:
- Use Jest for unit tests
- Use Playwright for E2E tests
- Test API routes with mock Prisma client

## Performance Considerations

- **Image optimization:** Next.js Image component with 1-hour cache
- **Database connections:** Pooled with singleton pattern
- **AI requests:** Queue-based to handle rate limits
- **File uploads:** Direct to R2 via presigned URLs

## Development Logging

작업 완료 시 로그를 남겨 컨텍스트를 유지하고 CLAUDE.md 업데이트를 관리합니다.

### 로그 위치
```
docs/logs/YYYY-MM-DD/HH-MM-유형-작업명.md
```

### 로그 작성 시점
- 새 API 엔드포인트 추가 후
- AI 서비스 모델/함수 추가 후
- 주요 버그 수정 후
- 데이터베이스 스키마 변경 후

### 템플릿
`docs/logs/TEMPLATE.md` 참조

### 일일 요약
하루 작업 마무리 시 `docs/logs/YYYY-MM-DD/DAILY-SUMMARY.md` 생성
- 완료된 작업 목록
- CLAUDE.md 변경 필요 사항
- 다음 작업 제안

## Git Branch Guidelines

### 중복 세션 작업 시 주의사항

**문제:** 여러 Claude 세션이 동일한 작업 디렉토리를 공유할 경우, 한 세션에서 브랜치를 변경하면 다른 세션도 영향을 받습니다.

**해결책: Git Worktree 사용**

서로 다른 브랜치에서 동시 작업이 필요할 때:

```bash
# 새 worktree 생성 (별도 디렉토리에서 다른 브랜치 작업)
git worktree add ../ai_ad_project-[feature-name] [branch-name]

# 예시
git worktree add ../ai_ad_project-avatar-motion feature/avatar-motion-workflow-refactor

# worktree 목록 확인
git worktree list

# worktree 제거 (작업 완료 후)
git worktree remove ../ai_ad_project-[feature-name]
```

**권장 네이밍:**
- `ai_ad_project-avatar-motion` - 아바타 모션 작업
- `ai_ad_project-image-ad` - 이미지 광고 작업
- `ai_ad_project-[feature]` - 기타 기능 작업

### 브랜치 전환 전 확인사항

1. 현재 브랜치 확인: `git branch --show-current`
2. 변경사항 확인: `git status --short`
3. 다른 세션이 같은 디렉토리 사용 중인지 확인
4. 필요 시 worktree 생성 후 별도 디렉토리에서 작업

### 주요 브랜치

| 브랜치 | 용도 |
|--------|------|
| `main` | 프로덕션 브랜치 |
| `feature/avatar-motion-workflow-refactor` | 아바타 모션 워크플로우 개선 |
| `feature/remove-background-menu` | 배경 메뉴 제거 작업 |

## Security Notes

- Never expose service role keys to client
- Use presigned URLs for file uploads
- Validate all user input before database operations
- Auth middleware runs on all routes except static assets
