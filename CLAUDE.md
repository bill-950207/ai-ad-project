# CLAUDE.md - AI Assistant Guide for AIAD

AIAD는 AI 서비스를 활용한 광고 콘텐츠(이미지, 영상, 아바타, 배경, 음악) 생성 SaaS 플랫폼입니다.

**Primary Language:** Korean | **Package:** `aiad`

## Technology Stack

- **Frontend:** Next.js 14.2.0 (App Router), React 18.3.0, Tailwind CSS, Lucide React
- **Backend:** Node.js, TypeScript 5.0.0, Prisma 7.2.0, PostgreSQL
- **Auth:** Supabase
- **Storage:** Cloudflare R2
- **AI Services:** FAL.ai, Kie.ai, Google Gemini, ElevenLabs, WaveSpeed AI

## Codebase Structure

```
app/
├── (auth)/              # 로그인, 회원가입
├── dashboard/           # 보호된 대시보드 (avatar, image-ad, video-ad, ad-products, music, background)
├── api/                 # API 라우트 (65+ 엔드포인트)
components/              # React 컴포넌트 (dashboard, video-ad, image-ad, ad-product, ui)
lib/
├── fal/, kie/, gemini/, wavespeed/, elevenlabs/  # AI 서비스 클라이언트
├── supabase/            # Supabase 클라이언트 (client, server, admin)
├── tts/                 # TTS 통합 서비스
├── storage/r2.ts        # Cloudflare R2
├── db.ts                # Prisma 클라이언트
└── prompts/             # AI 프롬프트 템플릿
prisma/schema.prisma     # DB 스키마
```

## Development Commands

```bash
npm run dev          # 개발 서버
npm run build        # 빌드
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
- **Connection:** DIRECT_URL 우선 사용

### Key Models
`profiles`, `avatars`, `avatar_outfits`, `ad_products`, `image_ads`, `video_ads`, `ad_music`, `ad_background`

### Status Enums
`PENDING` → `IN_QUEUE` → `PROCESSING` → `COMPLETED` / `FAILED`

### 크레딧 트랜잭션
```typescript
await prisma.$transaction(async (tx) => {
  await tx.profiles.update({ where: { id: user.id }, data: { credits: { decrement: 1 } } })
  return tx.avatars.create({ data: { ... } })
})
```

## Authentication

- Supabase Auth, `middleware.ts`에서 세션 자동 갱신
- Server: `lib/supabase/server.ts`, Client: `lib/supabase/client.ts`

## AI Services

**중요:** 새 API 추가 전 기존 모델/함수 중복 확인 필요. 상세 목록은 각 클라이언트 파일 참조.

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

### TTS 통합 (`lib/tts/unified-service.ts`)
Primary: WaveSpeed Minimax (한국어) → Fallback: ElevenLabs (다국어)

## API Response Patterns

```typescript
// 성공: { data: ... } 또는 { success: true, data: ... }
// 에러: { error: "메시지" }
// 페이지네이션: { items: [...], pagination: { page, pageSize, totalCount, totalPages, hasMore } }
```

### HTTP Status Codes
`200` Success | `201` Created | `400` Bad Request | `401` Unauthorized | `402` Insufficient Credits | `404` Not Found | `500` Server Error

## i18n

Languages: `ko` (default), `en`, `ja`
```typescript
const { t, language, setLanguage } = useLanguage()
```

## Security

- Service role key는 클라이언트에 노출 금지
- 파일 업로드는 presigned URL 사용
- 모든 사용자 입력 검증 필수
