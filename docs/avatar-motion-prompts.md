# 아바타 모션 영상 생성 - LLM 프롬프트 정리

> 파일 위치: `lib/prompts/avatar-motion.ts`

## 목차
1. [워크플로우 개요](#워크플로우-개요)
2. [시나리오 생성 프롬프트](#1-시나리오-생성-프롬프트)
3. [AI 추천 설정 프롬프트](#2-ai-추천-설정-프롬프트)
4. [AI 아바타 생성 프롬프트](#3-ai-아바타-생성-프롬프트)
5. [의상 변환 프롬프트](#4-의상-변환-프롬프트)
6. [배치 프레임 프롬프트](#5-배치-프레임-프롬프트-가장-중요)
7. [영상 생성 프롬프트](#6-영상-생성-프롬프트)

---

## 워크플로우 개요

```
[Step 2: 시나리오 선택]
    │
    ├── LLM: 시나리오 생성 (3개)
    │
    ▼
[Step 3: 영상 설정]
    │
    ├── LLM: AI 추천 설정 (선택사항)
    │
    ▼
[Step 4: 프레임 생성]
    │
    ├── LLM: AI 아바타 생성 (ai-generated 타입 시)
    ├── Z-Image I2I: 의상 변환
    ├── LLM: 배치 프레임 프롬프트 생성 ★
    └── Seedream: 이미지 생성
    │
    ▼
[Step 5: 영상 생성]
    │
    └── Vidu Q2: 영상 생성 (motionPromptEN 사용)
```

---

## 1. 시나리오 생성 프롬프트

### 템플릿: `SCENARIO_GENERATION_TEMPLATE`

**용도**: 제품과 아바타 정보를 기반으로 3개의 시나리오 컨셉 생성

**API**: `/api/avatar-motion/generate-story`

### 입력 변수
| 변수 | 설명 | 예시 |
|------|------|------|
| `productName` | 제품명 | "모이스처 크림" |
| `productDescription` | 제품 설명 | "수분 보습 크림" |
| `productSellingPoints` | 셀링 포인트 | "24시간 보습, 자연 성분" |
| `avatarDescription` | 아바타 설명 | "20대 여성, 친근한 분위기" |
| `avatarType` | 아바타 타입 | "ai-generated" / "my-avatar" |

### LLM 입력 (시스템 프롬프트)

```
You are an award-winning SHORT FILM director who creates viral video ads that feel like MINI MOVIES.

Your specialty: Creating 15-30 second video stories with CLEAR NARRATIVE ARCS where something HAPPENS - not just "person holds product and smiles."

=== STORYTELLING PHILOSOPHY ===

**EVERY AD IS A MINI MOVIE:**
Think of each scenario as a short film with:
- A BEGINNING: Setup the situation, create context or problem
- A MIDDLE: Something happens - discovery, action, transformation
- AN END: Resolution, payoff, emotional conclusion

**AVOID BORING "PRODUCT SHOWCASE" ADS:**
❌ BAD: "Model holds product, looks at camera, smiles"
❌ BAD: "Model picks up product, uses it, gives thumbs up"
❌ BAD: "Model in nice location with product, poses for camera"

✅ GOOD: "Model discovers something unexpected → reacts → product creates a moment"
✅ GOOD: "Model has a small problem → tries product → satisfying transformation"
✅ GOOD: "Model in mundane situation → product creates special/magical moment"

**STORY BEATS (MUST INCLUDE IN CONCEPT):**
1. SETUP/TRIGGER: What starts the story? (NOT just "picking up product")
2. ACTION/JOURNEY: What HAPPENS? (NOT just "using product")
3. PAYOFF/RESOLUTION: How does it end differently than it started?

STORY ARCHETYPES (use different ones):
- [DISCOVERY]: Model finds/notices something → curiosity → delight
- [PROBLEM-SOLUTION]: Small frustration → product helps → relief/satisfaction
- [RITUAL]: Peaceful routine moment → product enhances → contentment
- [TRANSFORMATION]: Before state → product use → noticeably different after state
- [SURPRISE]: Unexpected moment → product creates special feeling
```

### LLM 출력 (JSON)

```json
{
  "scenarios": [
    {
      "id": "1",
      "title": "시나리오 제목 (한국어, 8자 이내)",
      "description": "한 문장 설명 (한국어, 30자 이내)",
      "storyType": "discovery | problem-solution | ritual | transformation | surprise",
      "concept": "전체 스토리 (한국어, 4-5문장)",
      "storyBeats": {
        "setup": "시작 상황 (한국어, 1-2문장)",
        "middle": "중간 전개 (한국어, 1-2문장)",
        "payoff": "마무리 (한국어, 1-2문장)"
      },
      "productRole": "제품의 스토리 역할 (한국어, 1문장)",
      "emotionalArc": "감정 변화 (예: '피곤함→상쾌함')",
      "mood": "분위기 키워드 (한국어, 2-3단어)",
      "visualStyle": "영상 스타일 (한국어)",
      "tags": ["태그1", "태그2", "태그3"]
    },
    { "id": "2", ... },
    { "id": "3", ... }
  ]
}
```

---

## 2. AI 추천 설정 프롬프트

### 템플릿: `AI_RECOMMENDATION_TEMPLATE`

**용도**: 시나리오에 맞는 최적의 영상 설정 추천

**API**: `/api/avatar-motion/recommend-settings`

### 입력 변수
| 변수 | 설명 |
|------|------|
| `scenarioTitle` | 시나리오 제목 |
| `scenarioDescription` | 시나리오 설명 |
| `scenarioConcept` | 시나리오 컨셉 |
| `productCategory` | 제품 카테고리 |
| `targetPlatform` | 타겟 플랫폼 (기본: 소셜 미디어) |

### LLM 입력 (시스템 프롬프트)

```
You are an expert video production consultant specializing in short-form video ads.

Your task is to analyze the scenario/story and recommend optimal video settings:
1. Aspect ratio (9:16 for vertical/social, 16:9 for horizontal/youtube, 1:1 for square/instagram)
2. Number of scenes (2-10)
3. Duration for each scene
4. Movement intensity for each scene

**ASPECT RATIO GUIDELINES:**
- "9:16": Best for TikTok, Instagram Reels, YouTube Shorts (vertical, mobile-first)
- "16:9": Best for YouTube, website embeds (horizontal, desktop-friendly)
- "1:1": Best for Instagram Feed, Facebook (square, versatile)

**DURATION PER SCENE (SHORT-FORM OPTIMIZED):**
- 2-3s: Recommended default for social media - captures attention
- 4-5s: Use sparingly for emotional peaks or hero product moments
- 6-8s: Only for luxury/premium positioning or tutorial content

⚠️ DEFAULT TO 2-3 SECONDS unless content specifically requires longer.

**MOVEMENT AMPLITUDE:**
- "auto": Let the model decide
- "small": Subtle (talking, slight gestures)
- "medium": Normal (walking, reaching)
- "large": Dynamic (active movements)
```

### LLM 출력 (JSON)

```json
{
  "recommendation": {
    "aspectRatio": "9:16",
    "sceneCount": 3,
    "sceneDurations": [3, 4, 3],
    "movementAmplitudes": ["medium", "medium", "small"],
    "reasoning": "추천 이유 (한국어, 2-3문장)"
  }
}
```

---

## 3. AI 아바타 생성 프롬프트

### 템플릿: `CONTEXT_AWARE_AVATAR_TEMPLATE`

**용도**: 영상 컨텍스트를 분석하여 최적의 아바타 디자인

**API**: `/api/avatar-motion/generate-avatars`

### 입력 변수
| 변수 | 설명 |
|------|------|
| `productName` | 제품명 |
| `productDescription` | 제품 설명 |
| `productCategory` | 제품 카테고리 |
| `storyTitle` | 스토리 제목 |
| `storyDescription` | 스토리 설명 |
| `startFrameDescription` | 시작 프레임 설명 |
| `mood` | 분위기 |
| `action` | 주요 동작 |
| `locationPrompt` | 위치/배경 설명 |

### LLM 입력 (시스템 프롬프트)

```
You are an expert casting director and creative director for UGC-style product advertisement videos.

ANALYSIS APPROACH:
1. Understand the PRODUCT - What is being advertised? Who is the target customer?
2. Understand the STORY - What is the narrative? What emotions should the avatar convey?
3. Understand the MOOD - Is it energetic? Calm? Luxurious? Casual?
4. Understand the LOCATION - Where will the video be shot? What style fits?

AVATAR DESIGN PRINCIPLES:
1. The avatar should feel AUTHENTIC to the product's target audience
2. The avatar should be able to naturally perform the described actions
3. The avatar's style should match the video's mood and location

CRITICAL RULES:
1. The avatar must look like a real person, not AI-generated
2. NEVER include: illustration, cartoon, anime, 3D render, CGI, painting, sketch, drawing
3. Design for UGC-style authenticity, not polished commercial looks

PHOTOREALISM REQUIREMENTS:
- Skin: natural skin texture with visible pores, subtle imperfections, realistic subsurface scattering
- Hair: individual strands visible, natural highlights and shadows, realistic hair texture
- Eyes: detailed iris patterns, natural catchlights, realistic eye moisture
- Quality: photorealistic, shot on Sony A7IV, 85mm f/1.4, natural lighting
```

### LLM 출력 (JSON)

```json
{
  "avatar": {
    "reasoning": "왜 이 아바타가 컨텍스트에 맞는지 (한국어, 2-3문장)",
    "prompt": "Detailed English prompt for z-image/turbo (80-100 words). Include: age, ethnicity, gender, hair style/color, facial features, expression matching the mood, body type, clothing appropriate for the location and product. End with photorealism tags.",
    "koreanDescription": "아바타 설명 (한국어, 25자 이내)"
  }
}
```

### 출력 예시

```json
{
  "avatar": {
    "reasoning": "스킨케어 제품의 타겟인 20대 여성에 맞춰 깨끗한 피부의 친근한 인플루언서 스타일로 디자인했습니다.",
    "prompt": "A 24-year-old East Asian woman with shoulder-length black hair styled in soft waves, natural makeup with dewy skin, warm brown eyes with a genuine friendly smile, wearing a cream knit sweater, slender build, in a bright modern bathroom setting, soft natural window light, photorealistic, shot on Sony A7IV, 85mm f/1.4, natural lighting",
    "koreanDescription": "친근한 뷰티 인플루언서"
  }
}
```

---

## 4. 의상 변환 프롬프트

### 함수: `buildOutfitPromptFromScenario()`

**용도**: 시나리오 분위기에 맞게 아바타 의상 변환 (Z-Image Turbo I2I 모델용)

**API**: `/api/avatar-motion/transform-outfit`

### 입력 변수
| 변수 | 설명 |
|------|------|
| `scenario.mood` | 시나리오 분위기 |
| `scenario.visualStyle` | 비주얼 스타일 |
| `scenario.concept` | 시나리오 컨셉 |
| `productCategory` | 제품 카테고리 |

### 프롬프트 생성 로직

```typescript
// 분위기 → 의상 스타일 매핑
const moodToStyle = {
  '밝고': 'bright and cheerful casual wear, light colors',
  '활기찬': 'energetic sporty casual outfit, vibrant colors',
  '차분': 'relaxed comfortable clothing, soft neutral tones',
  '세련된': 'sophisticated smart casual, minimalist style',
  ...
}

// 제품 카테고리 → 의상 힌트
const categoryToHint = {
  '스킨케어': 'clean minimal top, bathroom-ready casual',
  '패션': 'versatile base outfit that showcases product',
  '음료': 'casual comfortable wear suitable for relaxation',
  ...
}
```

### 출력 프롬프트 예시

```
The same person with exact same face and body, wearing a completely different outfit appropriate for modern casual lifestyle advertisement. Outfit style: bright and cheerful casual wear, light colors. The outfit should be clean minimal top, bathroom-ready casual. Suitable for 아침 스킨케어 루틴 scenario. Maintain exact same face, hair, and body proportions. Only change the clothing. Photorealistic, natural lighting, high quality portrait.
```

---

## 5. 배치 프레임 프롬프트 (가장 중요!)

### 템플릿: `BATCH_FRAME_PROMPT_TEMPLATE`

**용도**: 모든 씬의 첫 프레임 이미지 프롬프트와 영상 모션 프롬프트를 일괄 생성

**API**: `/api/avatar-motion/generate-batch-prompts`

### 입력 변수
| 변수 | 설명 |
|------|------|
| `scenarioTitle` | 시나리오 제목 |
| `storyType` | 스토리 유형 |
| `scenarioConcept` | 시나리오 컨셉 |
| `scenarioMood` | 분위기 |
| `scenarioVisualStyle` | 비주얼 스타일 |
| `productRole` | 제품의 스토리 역할 |
| `emotionalArc` | 감정 변화 |
| `storyBeatSetup` | 스토리 비트: 시작 |
| `storyBeatMiddle` | 스토리 비트: 중간 |
| `storyBeatPayoff` | 스토리 비트: 마무리 |
| `productName` | 제품명 |
| `productDescription` | 제품 설명 |
| `avatarDescription` | 아바타 설명 |
| `aspectRatio` | 화면 비율 |
| `sceneCount` | 씬 개수 |
| `sceneDurations` | 씬별 길이 |
| `movementAmplitudes` | 씬별 움직임 강도 |

### LLM 입력 (시스템 프롬프트) - 핵심 부분

```
=== IMAGE PROMPT vs MOTION PROMPT (CRITICAL DISTINCTION!) ===

**IMAGE PROMPT (prompt field) = STATIC IMAGE ONLY:**
The "prompt" field describes a SINGLE FROZEN MOMENT like a photograph.

✅ INCLUDE in image prompt:
- Person's STATIC pose (body position at ONE moment)
- Person's STATIC expression (smile, gaze direction)
- Clothing description
- Product position (where it is at this moment)
- Environment/background
- Lighting setup
- Camera angle and composition

❌ NEVER include in image prompt:
- Movement verbs: "walking", "reaching", "lifting", "turning", "moving"
- Camera motion: "camera pans", "zooms in", "dollying"
- Transitions: "then", "next", "after", "begins to", "starts to"
- Duration references: "over 3 seconds", "throughout the scene"
- Action sequences: "picks up then examines"

**MOTION PROMPT (motionPromptEN) = ALL MOVEMENT:**
The "motionPromptEN" field describes what HAPPENS during the video.

✅ INCLUDE in motion prompt:
- Body movements: walking, reaching, lifting, gesturing
- Expression changes: smile grows, eyes light up
- Product interaction motion: picks up, examines, presents
- Camera movement: slow zoom, gentle pan, static
- Movement quality: smooth, energetic, gentle, slow

**EXAMPLES:**

IMAGE PROMPT (Static):
✅ "The same person from Figure 1, wearing a cream knit sweater and light blue jeans, standing with weight on left leg, right hand holding the product from Figure 2 at chest level, warm genuine smile with eyes looking at camera, in a bright minimalist kitchen with white countertops and morning sunlight from window on right, shot on 50mm at f/2.8, medium shot from waist up"

❌ WRONG: "The person walks to the counter and picks up the product, then turns to camera with growing smile as she examines it"

MOTION PROMPT (Dynamic):
✅ "Starting from the standing pose, the person gently lifts the product closer to examine it, expression brightening with genuine delight. Subtle head tilt as eyes scan the product. Smooth turn toward camera to present the product. Natural breathing motion and relaxed shoulders throughout."

❌ WRONG: "Scene 2 of 3. The person is in a kitchen with nice lighting."
```

### 참조 이미지 규칙

```
=== REFERENCE IMAGES (CRITICAL!) ===

⚠️ ABSOLUTE RULES FOR REFERENCE IMAGES:
1. ALWAYS start prompts with "The same person from Figure 1"
2. NEVER describe the person's appearance (age, gender, ethnicity, hair color, facial features)
   - ❌ WRONG: "A 25-year-old East Asian woman with shoulder-length black hair..."
   - ✅ CORRECT: "The same person from Figure 1, wearing..."
3. ONLY describe: pose, expression, clothing, action, environment, lighting, camera
4. NEVER describe the product's appearance (color, material, brand, features)
   - ❌ WRONG: "the Nike Air Force 1 with white leather upper"
   - ❌ WRONG: "a black wireless speaker with LED lights"
   - ✅ CORRECT: "the product from Figure 2"
```

### LLM 출력 (JSON)

```json
{
  "visualConsistency": {
    "outfit": "cream cable-knit sweater with rolled sleeves, high-waisted light blue jeans, bare feet",
    "lighting": "soft morning sunlight from large window, warm golden tones",
    "colorGrading": "warm, slightly desaturated with lifted shadows",
    "cameraStyle": "50mm lens, shallow depth of field, eye-level angle"
  },
  "scenePrompts": [
    {
      "sceneIndex": 0,
      "role": "opening",
      "duration": 3,
      "connectionFromPrevious": "첫 장면",
      "narrativeContext": "아침에 화장대 앞에 앉아있다. 거울을 보며 피부 상태를 확인하는 모습.",
      "prompt": "The same person from Figure 1, wearing a cream cable-knit sweater with rolled sleeves and high-waisted light blue jeans, sitting at a white vanity desk with weight shifted to the right, left elbow resting on desk surface, right hand gently touching cheek, gentle contemplative expression with soft smile, gaze directed at mirror reflection, in a bright minimalist bedroom with white walls and natural wooden accents, soft morning sunlight streaming from large window on the left creating warm golden highlights, shot on 50mm lens at f/2.8, medium close-up from chest up, slightly elevated camera angle, photorealistic, shot on Sony A7IV, natural lighting",
      "motionPromptEN": "Starting from the seated contemplative pose, the person slowly turns head toward the product on the desk, eyes shifting with growing curiosity. Expression gradually brightens as attention focuses on the product. Gentle movement of the hand from cheek toward the product. Natural breathing motion, relaxed shoulders throughout.",
      "negativePrompt": "different outfit, different clothing, wardrobe change, different background, different lighting, standing pose"
    },
    {
      "sceneIndex": 1,
      "role": "development",
      "duration": 4,
      "connectionFromPrevious": "앞 씬에서 제품을 발견한 후 손을 뻗어 집는 동작",
      "narrativeContext": "제품을 들어 성분을 확인하며 관심을 보인다. 기대감이 표정에 드러난다.",
      "prompt": "The same person from Figure 1, wearing the same cream cable-knit sweater and light blue jeans, sitting at the same white vanity desk, torso turned slightly toward camera, both hands holding the product from Figure 2 at eye level, fingers gently wrapped around the product, curious engaged expression with eyebrows slightly raised, eyes focused on product label, lips parted in anticipation, in the same bright bedroom with morning sunlight, shot on 50mm lens at f/2.8, medium shot from waist up, photorealistic",
      "motionPromptEN": "Holding the product at eye level, the person slowly rotates it to examine different angles. Expression shifts from curiosity to pleasant surprise as they read the label. Subtle nod of approval, eyebrows relaxing into a satisfied look. Gentle lowering of the product toward application position.",
      "negativePrompt": "standing, different room, different outfit, product not visible"
    },
    {
      "sceneIndex": 2,
      "role": "closing",
      "duration": 3,
      "connectionFromPrevious": "제품 사용 후 만족스러운 결과를 보여주는 장면",
      "narrativeContext": "제품을 사용한 후 거울을 보며 만족스러운 미소를 짓는다. 피부가 촉촉해 보인다.",
      "prompt": "The same person from Figure 1, wearing the same cream cable-knit sweater and light blue jeans, sitting at the same white vanity desk, body facing mirror with face turned three-quarters toward camera, the product from Figure 2 placed on desk in foreground, right hand gently touching glowing cheek, confident satisfied smile with eyes slightly crinkled, radiant expression, in the same bright bedroom with soft morning light creating a gentle glow on skin, shot on 50mm lens at f/2.8, medium close-up, photorealistic",
      "motionPromptEN": "From the satisfied pose, the person's smile gradually widens into a genuine grin. Gentle tilt of head while admiring reflection. Hand slowly moves from cheek to rest on desk near the product. Final knowing glance toward camera, sharing the moment of satisfaction. Natural, confident body language throughout.",
      "negativePrompt": "standing, frowning, different outfit, different background, product hidden"
    }
  ]
}
```

---

## 6. 영상 생성 프롬프트

### 함수: `buildVideoGenerationPrompt()`

**용도**: 배치 프롬프트의 `motionPromptEN`을 영상 생성 모델(Vidu Q2)에 전달

### 입력
| 변수 | 설명 |
|------|------|
| `motionPromptEN` | 배치 프롬프트에서 생성된 영어 모션 설명 |
| `productName` | 제품명 (선택) |
| `mood` | 분위기 (선택) |
| `duration` | 영상 길이 (초) |

### 프롬프트 구성 로직

```typescript
// motionPromptEN이 있으면 그대로 사용 + 일관성 문구 추가
if (motionPromptEN && motionPromptEN.length > 20) {
  const consistencyClause = 'The person maintains the same appearance, outfit, and clothing throughout the entire video. Smooth, natural, and realistic human motion.'
  const productClause = productName
    ? `Product interaction with ${productName} is natural and fluid.`
    : ''
  const moodClause = mood ? `The overall mood is ${translateMoodToEnglish(mood)}.` : ''

  return `${motionPromptEN} ${consistencyClause} ${productClause} ${moodClause}`.trim()
}
```

### 최종 영상 생성 프롬프트 예시

```
Starting from the seated contemplative pose, the person slowly turns head toward the product on the desk, eyes shifting with growing curiosity. Expression gradually brightens as attention focuses on the product. Gentle movement of the hand from cheek toward the product. Natural breathing motion, relaxed shoulders throughout. The person maintains the same appearance, outfit, and clothing throughout the entire video. Smooth, natural, and realistic human motion. Product interaction with 모이스처 크림 is natural and fluid. The overall mood is calm and relaxed.
```

---

## 프롬프트 흐름 요약

```
┌─────────────────────────────────────────────────────────────────┐
│                    Step 2: 시나리오 생성                          │
├─────────────────────────────────────────────────────────────────┤
│ INPUT:  제품 정보 + 아바타 정보                                    │
│ LLM:    SCENARIO_GENERATION_TEMPLATE                            │
│ OUTPUT: 3개 시나리오 (title, concept, storyBeats, mood...)       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Step 3: AI 추천 설정 (선택)                    │
├─────────────────────────────────────────────────────────────────┤
│ INPUT:  선택한 시나리오 정보                                       │
│ LLM:    AI_RECOMMENDATION_TEMPLATE                              │
│ OUTPUT: aspectRatio, sceneCount, sceneDurations, amplitudes     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Step 4: 아바타 생성 (AI 타입 시)                │
├─────────────────────────────────────────────────────────────────┤
│ INPUT:  제품 + 시나리오 컨텍스트                                   │
│ LLM:    CONTEXT_AWARE_AVATAR_TEMPLATE                           │
│ OUTPUT: 아바타 프롬프트 (z-image/turbo용)                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Step 4: 의상 변환                              │
├─────────────────────────────────────────────────────────────────┤
│ INPUT:  아바타 이미지 + 시나리오 분위기                             │
│ 함수:   buildOutfitPromptFromScenario()                          │
│ OUTPUT: 의상 변환 프롬프트 (Z-Image I2I용)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               Step 4: 배치 프레임 프롬프트 생성 ★                  │
├─────────────────────────────────────────────────────────────────┤
│ INPUT:  시나리오 전체 정보 + 영상 설정                              │
│ LLM:    BATCH_FRAME_PROMPT_TEMPLATE                             │
│ OUTPUT: 씬별 { prompt (정적 이미지), motionPromptEN (동적 모션) }  │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│   이미지 생성 (Seedream)   │     │   영상 생성 (Vidu Q2)    │
├─────────────────────────┤     ├─────────────────────────┤
│ prompt (정적 이미지 설명)  │     │ motionPromptEN (모션)   │
│ + 아바타 이미지 (Figure 1)│     │ + 첫 프레임 이미지       │
│ + 제품 이미지 (Figure 2)  │     │                         │
└─────────────────────────┘     └─────────────────────────┘
```

---

## 핵심 규칙 요약

### 1. 이미지 프롬프트 (prompt)
- **정적 이미지**만 설명 (사진처럼)
- 동작 동사 금지: walking, reaching, lifting, turning
- 전환어 금지: then, next, after, begins to
- 카메라 움직임 금지: pans, zooms, dollying

### 2. 모션 프롬프트 (motionPromptEN)
- **모든 움직임** 설명
- 몸의 동작, 표정 변화, 제품 상호작용
- 카메라 움직임 (slow zoom, gentle pan)
- 순수 영어, 메타데이터 없음

### 3. 참조 이미지 규칙
- 인물: "The same person from Figure 1" (외모 설명 금지)
- 제품: "the product from Figure 2" (제품 외관 설명 금지)
- 의상: 구체적으로 설명 (매 씬 동일)
