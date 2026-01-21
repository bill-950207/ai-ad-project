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

### Connection
- **File:** `lib/db.ts`
- Uses singleton pattern with hot-reload support in development
- Connection pooling: max 10 connections, 30s idle timeout

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

### FAL.ai (lib/fal/client.ts)
- Queue-based image generation
- Returns `request_id` for status polling

### Kie.ai (lib/kie/client.ts)
- Alternative provider for images/videos
- Z-Image for avatar generation

### Gemini (lib/gemini/client.ts)
- Prompt generation and content analysis
- Script writing for video ads

### TTS (lib/tts/unified-service.ts)
- Unified interface with fallback support
- Primary: ElevenLabs, Fallback: WaveSpeed

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

## Security Notes

- Never expose service role keys to client
- Use presigned URLs for file uploads
- Validate all user input before database operations
- Auth middleware runs on all routes except static assets
