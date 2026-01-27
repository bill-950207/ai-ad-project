# 이미지 광고 프롬프트 분석

## 1. 전체 흐름

```
[사용자]
    │
    ├─(1) 광고 유형 선택 (holding, using, wearing 등)
    │
    ▼
[POST /api/image-ads/recommend-options]
    │
    ├─ generateMultipleRecommendedOptions() ─────────────────┐
    │                                                        │
    │   LLM 입력:                                            │
    │   - 제품 이미지 (Figure 1)                              │
    │   - 제품명, 설명, 셀링 포인트                            │
    │   - 광고 유형 설명                                      │
    │   - 카테고리 옵션 목록 (pose, gaze, background 등)       │
    │   - 아바타 정보 (있는 경우)                              │
    │                                                        │
    │   LLM 출력:                                            │
    │   - 3개 시나리오 (title, description, targetAudience)   │
    │   - 각 시나리오별 추천 옵션 (recommendedOptions)         │
    │   - 각 시나리오별 AI 아바타 스타일 (recommendedAvatarStyle)
    │                                                        │
    ▼ ◀──────────────────────────────────────────────────────┘
[사용자]
    │
    ├─(2) 시나리오 선택 및 옵션 조정
    │
    ▼
[POST /api/image-ads]
    │
    ├─ generateImageAdPrompt() ──────────────────────────────┐
    │                                                        │
    │   LLM 입력:                                            │
    │   - 아바타 이미지 (Figure 1)                            │
    │   - 의상 이미지 (Figure 2, 선택)                        │
    │   - 제품 이미지 (Figure 3)                              │
    │   - 참조 스타일 이미지 (Figure 4, 선택)                  │
    │   - 광고 유형, 선택된 옵션들                             │
    │   - 아바타 체형 정보                                    │
    │                                                        │
    │   LLM 출력:                                            │
    │   - optimizedPrompt (영어 80-120 words)                 │
    │   - koreanDescription (한국어 요약)                     │
    │   - productHasLogo (제품 로고 유무)                     │
    │                                                        │
    ▼ ◀──────────────────────────────────────────────────────┘
[Seedream 4.5 Edit]
    │
    ▼
[생성된 이미지]
```

---

## 2. 함수별 LLM 입력/출력 상세 분석

### 2.1 generateMultipleRecommendedOptions

**파일:** `lib/gemini/category.ts` (150-458행)

**목적:** 제품 분석 후 3가지 다양한 광고 시나리오 추천

#### LLM 입력 구조

```typescript
// 1. 이미지 입력
parts: [
  { inlineData: productImage },  // 제품 이미지 (Figure 1)
  { text: prompt }
]

// 2. 텍스트 프롬프트 구조
`You are an expert advertising creative director...

=== STEP 1: DEEP PRODUCT ANALYSIS ===
// 제품 심층 분석 지시
1. PRODUCT FUNDAMENTALS (카테고리, 가격대)
2. VISUAL IDENTITY (색상, 재질, 디자인)
3. BRAND SIGNALS (브랜드 성격)
4. UNIQUE SELLING PROPOSITION

=== PRODUCT INFO ===
Name: ${productName}
Description: ${productDescription}
Selling Points: ${productSellingPoints.join(', ')}

=== AD TYPE ===
${adType}: ${adTypeDescriptions[adType]}

=== AVAILABLE OPTIONS ===
[outfit]
  - keep_original: Keep the original outfit...
  - casual_everyday: Casual everyday wear...
[pose]
  - natural_hold: Naturally holding the product
  - showing_camera: Showing product to camera
...

=== STEP 2: DYNAMIC SCENARIO GENERATION ===
// 시나리오 생성 지침
**NAMING REQUIREMENT:** 고유한 컨셉명 (8-15자)
**TARGETING REQUIREMENT:** 제품에 맞는 타겟
**DIVERSITY REQUIREMENT:** 3개 시나리오 다양성

=== AI AVATAR RECOMMENDATION === (AI 아바타 사용 시)
// 아바타 추천 지침
1. STRUCTURED FIELDS (gender, age, style, ethnicity, bodyType)
2. avatarPrompt (40-60 words)
3. avatarDescription (15-25자)
`
```

#### LLM 출력 스키마 (Structured Output)

```json
{
  "scenarios": [
    {
      "title": "시나리오명 (8-15자)",
      "description": "설명 (30-50자)",
      "targetAudience": "타겟 오디언스",
      "conceptType": "컨셉 타입",
      "recommendations": [
        {
          "key": "pose",
          "value": "natural_hold",
          "reason": "추천 이유"
        },
        {
          "key": "background",
          "value": "home",
          "customText": "커스텀 텍스트 (선택)",
          "reason": "추천 이유"
        }
      ],
      "overallStrategy": "전체 전략 설명",
      "suggestedPrompt": "추천 프롬프트",
      "recommendedAvatarStyle": {
        "avatarPrompt": "영어 40-60 words",
        "avatarDescription": "한국어 15-25자",
        "gender": "female",
        "age": "young",
        "style": "natural",
        "ethnicity": "korean",
        "bodyType": "slim"
      }
    }
  ]
}
```

#### 문제점 및 개선 필요 사항

| 문제 | 현상 | 원인 분석 |
|------|------|----------|
| **시나리오 제목 중복** | "프리미엄 감성", "트렌디 무드" 같은 일반적 제목 반복 | NAMING REQUIREMENT가 프롬프트 하단에 있어 강조 부족 |
| **타겟 분석 부족** | 제품 특성과 무관한 타겟 설정 | 제품 분석 → 타겟 연결 논리가 약함 |
| **옵션 조합 불일치** | mood: luxury인데 background: home | 옵션 간 일관성 체크 로직 없음 |
| **아바타 스타일 단순** | 비슷한 아바타 반복 추천 | 시나리오별 다양성 요구가 약함 |

---

### 2.2 generateImageAdPrompt

**파일:** `lib/gemini/category.ts` (524-792행)

**목적:** 최종 이미지 생성용 Seedream 4.5 프롬프트 생성

#### LLM 입력 구조

```typescript
// 1. 이미지 입력 (순서 중요!)
parts: [
  { inlineData: avatarImage },      // Figure 1: 아바타
  { inlineData: outfitImage },      // Figure 2: 의상 (선택)
  { inlineData: productImage },     // Figure 3: 제품
  { inlineData: referenceStyle },   // Figure 4: 참조 스타일 (선택)
  { text: prompt }
]

// 2. 텍스트 프롬프트 구조
`You are an expert advertising photographer...

=== AD TYPE DESCRIPTION ===
${adType}: ${adTypeDescriptions[adType]}

=== ATTACHED IMAGES ===
- Figure 1: Avatar/Model reference image (female model)
- Figure 2: Product reference image (cosmetic product)

⚠️ CRITICAL REFERENCE RULES:
- Refer to model as "the female model from Figure 1"
- Refer to product as "the cosmetic product from Figure 2"
- DO NOT mention product name or brand

=== AVATAR BODY CONSISTENCY (아바타 선택 시) ===
Body type hint: ${avatarBodyDescription}
STRICT RULES:
- DO NOT exaggerate body features
- Keep proportions IDENTICAL to reference

=== CRITICAL: LIGHTING DESCRIPTION RULES ===
${LIGHTING_CAMERA_INSTRUCTION}
// 조명 효과만 묘사, 장비 언급 금지

=== COMMERCIAL ADVERTISEMENT STYLE ===
1. LIGHTING: professional lighting EFFECT
2. MODEL EXPRESSION: Natural, NOT forced smile
3. PRODUCT PRESENTATION: Product as HERO
4. PRODUCT APPEARANCE PRESERVATION: IDENTICAL to reference
5. OVERALL AESTHETIC: Magazine-worthy composition
6. COLOR & ATMOSPHERE: Rich, vibrant colors

=== LOGO & TEXT RULES ===
${BRAND_PRESERVATION_INSTRUCTION}
// 로고 분석 후 적절한 처리

=== NO GRAPHIC OVERLAYS ===
${NO_OVERLAY_ELEMENTS}
// 텍스트, 바코드, UI 요소 금지

Output JSON format:
{
  "productHasLogo": true/false,
  "optimizedPrompt": "English 80-120 words...",
  "koreanDescription": "한국어 요약"
}
`
```

#### LLM 출력 구조

```json
{
  "productHasLogo": false,
  "optimizedPrompt": "The female model from Figure 1, wearing the same outfit as in the reference, holding the cosmetic product from Figure 2 at chest level, in a bright modern living room with natural plants, soft natural daylight streaming from large window on the left creating gentle shadows, looking directly at camera with natural relaxed expression, professional studio-quality lighting effect with controlled highlights, shot on 35mm lens at f/8.0, crystal sharp background, professional commercial photography, brand campaign quality, high-end advertisement",
  "koreanDescription": "밝은 거실에서 자연스럽게 제품을 들고 있는 모델"
}
```

#### 후처리 (코드에서 추가)

```typescript
// 1. 오버레이 방지 문구 추가
const overlayPrevention = 'Generate a pure photograph only with absolutely no graphic overlays...'

// 2. 조명 장비 방지 문구 추가
const lightingEquipmentPrevention = 'CRITICAL: NO lighting equipment should be visible...'

// 3. 로고 없는 제품일 경우
if (result.productHasLogo === false) {
  result.optimizedPrompt += NO_LOGO_PROMPT_SUFFIX
}

// 최종 프롬프트
finalPrompt = `${optimizedPrompt}. ${NO_LOGO_PROMPT_SUFFIX} ${lightingEquipmentPrevention} ${overlayPrevention}`
```

#### 문제점 및 개선 필요 사항

| 문제 | 현상 | 원인 분석 |
|------|------|----------|
| **프롬프트 과도하게 김** | 최종 프롬프트가 200+ words | 후처리에서 반복 문구 추가 |
| **Figure 참조 불일치** | LLM이 잘못된 Figure 번호 사용 | 이미지 순서가 동적으로 변하는데 프롬프트가 정적 |
| **조명 장비 여전히 등장** | softbox, ring light 이미지에 표시 | 네거티브 프롬프트 전달 안됨 (Seedream은 네거티브 지원 약함) |
| **표정 부자연스러움** | AI 스마일 현상 | "natural expression" 지시가 모호 |
| **체형 변형** | 아바타와 다른 체형 생성 | 체형 지시가 프롬프트 내에서 희석됨 |

---

## 3. 공통 상수/컴포넌트 분석

### 3.1 광고 유형 설명 (adTypeDescriptions)

**파일:** `lib/gemini/category.ts` (22-30행)

```typescript
const adTypeDescriptions: Record<ImageAdType, string> = {
  productOnly: 'Product only shot - Clean product photography',
  holding: 'Holding shot - Model naturally holding the product',
  using: 'Using shot - Model actively using the product',
  wearing: 'Wearing shot - Fashion advertisement',
  lifestyle: 'Lifestyle - Natural everyday scene',
  unboxing: 'Unboxing - Product reveal style',
  seasonal: 'Seasonal/Theme - Themed atmosphere',
}
```

**문제:** 설명이 너무 간단하여 LLM이 광고 유형의 미묘한 차이를 이해하기 어려움

### 3.2 네거티브 프롬프트

**파일:** `lib/prompts/common.ts`

| 상수명 | 용도 |
|--------|------|
| `EQUIPMENT_NEGATIVE_PROMPT` | 조명/카메라 장비 방지 |
| `OVERLAY_NEGATIVE_PROMPT` | 텍스트/UI 오버레이 방지 |
| `PRODUCT_NEGATIVE_PROMPT` | 제품 변형 방지 |

**문제:** Seedream 4.5 Edit은 네거티브 프롬프트 지원이 제한적 → 메인 프롬프트에 "NO..." 구문 포함해야 함

### 3.3 조명 가이드

**파일:** `lib/prompts/common.ts` - `LIGHTING_CAMERA_INSTRUCTION`

```
CORRECT: "soft warm light from the left creating gentle shadows"
WRONG: "softbox on the left" (describes equipment)
```

**문제:** 예시가 있지만 LLM이 무시하는 경우 많음 → 더 강력한 제약 필요

---

## 4. API 라우트 분석

### 4.1 POST /api/image-ads/recommend-options

**파일:** `app/api/image-ads/recommend-options/route.ts`

```typescript
// 입력
{
  adType: 'holding',
  productName: '수분 크림',
  productDescription: '고보습 수분 크림',
  productSellingPoints: ['24시간 보습', '저자극'],
  language: 'ko',
  multiple: true,  // 3개 시나리오 모드
  hasAvatar: true,
  avatarInfo: {
    type: 'ai-generated',
    aiOptions: {
      targetGender: 'female',
      targetAge: 'young',
      style: 'natural',
      ethnicity: 'korean',
      bodyType: 'slim'
    }
  },
  productImageUrl: 'https://...'
}

// 출력
{
  scenarios: [
    {
      title: '데일리 케어',
      description: '일상 속 자연스러운 스킨케어 루틴',
      targetAudience: '20-30대 직장인 여성',
      recommendedOptions: {
        pose: { value: 'natural_hold', reason: '...' },
        background: { value: 'home', reason: '...' },
        // ...
      },
      recommendedAvatarStyle: {
        avatarPrompt: 'A young Korean woman in her late 20s...',
        avatarDescription: '자연스러운 20대 후반 여성',
        gender: 'female',
        age: 'young',
        // ...
      }
    },
    // ... 2개 더
  ]
}
```

### 4.2 POST /api/image-ads

**파일:** `app/api/image-ads/route.ts`

```typescript
// 입력
{
  adType: 'holding',
  productId: 'uuid',
  avatarIds: ['uuid'] 또는 ['ai-generated'],
  prompt: '밝은 분위기에서 제품을 들고 있는 모습',
  imageSize: '1024x1536',
  quality: 'high',
  numImages: 2,
  options: {
    pose: 'natural_hold',
    background: 'home',
    lighting: 'natural',
    mood: 'friendly'
  },
  aiAvatarOptions: {  // AI 아바타 사용 시
    targetGender: 'female',
    targetAge: 'young',
    style: 'natural',
    ethnicity: 'korean'
  }
}

// 출력
{
  success: true,
  requestIds: ['fal:xxx', 'fal:yyy'],
  numImages: 2,
  imageAdIds: ['uuid'],
  creditUsed: 4
}
```

---

## 5. 데이터 흐름 요약

```
┌─────────────────────────────────────────────────────────────────┐
│                    LLM 입력 데이터 소스                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [DB: ad_products]          [DB: avatars]       [DB: avatar_outfits]
│  - name                     - image_url         - image_url
│  - description              - image_url_original - image_url_original
│  - rembg_image_url          - options (체형 등)
│  - image_url_original
│                                                                 │
│  [사용자 입력]              [카테고리 옵션]
│  - adType                   - CATEGORY_OPTIONS (정적)
│  - prompt (추가 지시)        - OPTION_DESCRIPTIONS (정적)
│  - options (선택)
│  - aiAvatarOptions
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LLM 처리 (Gemini)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. generateMultipleRecommendedOptions                          │
│     - 제품 이미지 분석                                           │
│     - 3개 시나리오 생성                                          │
│     - 옵션 추천 + 이유                                           │
│                                                                 │
│  2. generateImageAdPrompt                                       │
│     - 아바타/제품 이미지 분석                                     │
│     - Figure 참조 프롬프트 생성                                   │
│     - 로고 유무 판단                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LLM 출력 데이터                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [시나리오 추천]                                                 │
│  - 3개 시나리오 (title, description, targetAudience)            │
│  - 카테고리별 추천 값 + 이유                                     │
│  - AI 아바타 스타일 (아바타 생성용)                               │
│                                                                 │
│  [이미지 프롬프트]                                               │
│  - optimizedPrompt (Seedream 4.5용 영어 프롬프트)               │
│  - koreanDescription (UI 표시용)                                │
│  - productHasLogo (로고 처리 분기용)                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    이미지 생성 (Seedream 4.5)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  입력:                                                          │
│  - prompt: LLM 생성 프롬프트 + 후처리 문구                       │
│  - image_urls: [아바타, (의상), 제품, (참조스타일)]              │
│  - aspect_ratio: 1:1 | 3:2 | 2:3                               │
│  - quality: basic | high                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. 주요 개선 필요 사항 정리

### 6.1 시나리오 추천 (generateMultipleRecommendedOptions)

| 우선순위 | 문제 | 개선 방향 |
|----------|------|----------|
| HIGH | 시나리오 제목 일반적/중복 | 제품 특성 기반 고유 제목 생성 강제 |
| HIGH | 옵션 간 불일치 | 옵션 조합 일관성 검증 지시 추가 |
| MEDIUM | 타겟 분석 부족 | 제품→타겟 연결 논리 강화 |
| MEDIUM | 아바타 스타일 단순 | 시나리오별 차별화 요구 강화 |

### 6.2 이미지 프롬프트 (generateImageAdPrompt)

| 우선순위 | 문제 | 개선 방향 |
|----------|------|----------|
| HIGH | 프롬프트 너무 김 | 핵심 요소만 간결하게 |
| HIGH | 조명 장비 등장 | 네거티브 대신 포지티브 지시 강화 |
| HIGH | 표정 부자연스러움 | 구체적 표정 묘사 추가 |
| MEDIUM | Figure 참조 불일치 | 동적 Figure 번호 할당 로직 개선 |
| MEDIUM | 체형 변형 | 체형 지시 분리 및 강조 |

### 6.3 공통 컴포넌트

| 우선순위 | 문제 | 개선 방향 |
|----------|------|----------|
| HIGH | 광고 유형 설명 부족 | 상세 가이드라인 추가 |
| MEDIUM | 네거티브 프롬프트 효과 없음 | 포지티브 지시로 전환 |
| LOW | 옵션 설명 영어만 | 다국어 지원 고려 |
