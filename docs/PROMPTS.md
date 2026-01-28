# AIAD 프롬프트 정리 문서

이 문서는 AIAD 서비스에서 사용하는 모든 AI 프롬프트의 입력/출력 구조를 정리합니다.

---

## 1. 프롬프트 아키텍처 개요

### 1.1 디렉토리 구조

```
lib/
├── prompts/                    # 프롬프트 템플릿 저장소
│   ├── index.ts               # 통합 export
│   ├── types.ts               # 타입 정의
│   ├── common.ts              # 공통 컴포넌트
│   ├── image-ad.ts            # 이미지 광고
│   ├── scripts.ts             # 대본 생성
│   ├── first-frame.ts         # 첫 프레임
│   └── avatar-motion/         # 아바타 모션
│       ├── avatar-generation.ts
│       ├── frame-generation.ts
│       ├── scenario-generation.ts
│       ├── video-generation.ts
│       └── recommendation.ts
│
├── gemini/                     # Gemini API 연동
│   ├── avatar-prompt.ts
│   ├── video-prompt.ts
│   ├── product.ts
│   ├── scenario.ts
│   └── image-editing.ts
│
└── avatar/
    └── prompt-builder.ts      # 옵션 기반 프롬프트 빌드
```

### 1.2 AI 모델별 용도

| AI 모델 | 용도 | 언어 |
|---------|------|------|
| Gemini | 프롬프트 생성, 시나리오, 대본 | 한국어 시스템 |
| Seedream 4.5 | 이미지 생성 | 영어 60-100 words |
| GPT-Image 1.5 | AI 아바타 생성 | 영어 50-100 words |
| Vidu Q2 / Kling | 영상 생성 | 영어 40-70 words |

---

## 2. 공통 컴포넌트 (lib/prompts/common.ts)

### 2.1 포토리얼리즘 필수 요소

| 요소 | 프롬프트 |
|------|----------|
| skin | smooth natural skin with healthy glow |
| hair | individual strands catching light naturally |
| eyes | realistic eye reflections with natural catchlights |
| quality | professional commercial photography, Hyperrealistic photograph, 8K RAW quality |

### 2.2 네거티브 프롬프트

| 유형 | 상수명 | 용도 |
|------|--------|------|
| 공통 | COMMON_NEGATIVE_PROMPT | AI 아티팩트, 저품질 방지 |
| 아바타 | AVATAR_NEGATIVE_PROMPT | 부자연스러운 표정 방지 |
| 제품 | PRODUCT_NEGATIVE_PROMPT | 제품 표면 변경 방지 |
| 장비 | EQUIPMENT_NEGATIVE_PROMPT | 조명/카메라 장비 노출 방지 |

### 2.3 UGC 배경 규칙

```
Background should be clearly visible and mostly in focus.
Use f/11 aperture. NO heavy bokeh, NO artificial blur.
```

---

## 3. 대본 생성 (lib/prompts/scripts.ts)

### 입력

| 변수 | 설명 |
|------|------|
| productInfo | 제품 정보 |
| durationSeconds | 영상 길이 |
| targetCharCount | 목표 글자 수 |

### 출력

```json
{
  "productSummary": "제품 요약 (한국어)",
  "scripts": [
    { "style": "formal", "styleName": "공식적", "content": "...", "estimatedDuration": 15 },
    { "style": "casual", "styleName": "캐주얼", "content": "...", "estimatedDuration": 15 },
    { "style": "energetic", "styleName": "활기찬", "content": "...", "estimatedDuration": 15 }
  ]
}
```

### TTS 속도 설정

| 언어 | 속도 |
|------|------|
| 한국어 | 5.0 chars/sec |
| 영어 | 2.5 words/sec |
| 일본어 | 4.5 chars/sec |

---

## 4. 첫 프레임 이미지 (lib/prompts/first-frame.ts)

### 카메라 구도

| 구도 | 설명 | 조리개 |
|------|------|--------|
| selfie-high | 하이앵글 30도 위 | f/11 |
| selfie-front | 정면 눈높이 | f/11 |
| ugc-closeup | UGC 미디엄 클로즈업 | f/11 |
| ugc-selfie | POV 셀카 (휴대폰 안보임) | f/11 |
| tripod | 고정 카메라 | f/16 |
| fullbody | 전신샷 | f/16 |

### 비디오 타입별 가이드

| 타입 | 환경 | 포즈 |
|------|------|------|
| UGC | casual home setting | relaxed natural pose |
| podcast | warm ambient lighting | conversational posture |
| expert | modern office | professional posture |

### 출력

```json
{
  "prompt": "English prompt (50-80 words)",
  "locationDescription": "장소 설명 (한국어)"
}
```

---

## 5. 아바타 모션 (lib/prompts/avatar-motion/)

### 5.1 AI 아바타 생성

**입력**
| 변수 | 설명 |
|------|------|
| targetGender | male/female/any |
| targetAge | young/middle/mature |
| style | natural/professional/casual |
| ethnicity | korean/asian/western |
| productInfo | 제품 정보 |

**출력**
```json
{
  "avatar": {
    "prompt": "English 60-80 words",
    "koreanDescription": "한국어 20자"
  }
}
```

### 5.2 프레임 이미지 생성

**입력**
| 변수 | 설명 |
|------|------|
| frameDescription | 프레임 설명 (한국어) |
| avatarDescription | 아바타 설명 |
| productInfo | 제품 정보 |
| frameType | start / end |
| aspectRatio | 화면 비율 |

**출력**
```json
{
  "prompt": "English 80-120 words",
  "negativePrompt": "네거티브 프롬프트"
}
```

### 5.3 시나리오 생성

**입력**
| 변수 | 설명 |
|------|------|
| productName | 제품명 |
| productDescription | 제품 설명 |
| productSellingPoints | 셀링 포인트 |
| avatarDescription | 아바타 설명 |
| avatarType | existing/ai-generated |

**출력 (단일 씬)**
```json
{
  "scenarios": [{
    "id": "1",
    "title": "한국어 8자",
    "description": "한국어 25자",
    "concept": "한국어 2-3문장",
    "productAppearance": "제품 등장 방식",
    "imageSummary": "이미지 요약 (한국어)",
    "videoSummary": "모션 요약 (한국어)",
    "firstFramePrompt": "English 60-80 words",
    "motionPromptEN": "English 60-80 words",
    "mood": "분위기",
    "location": "장소",
    "tags": ["태그1", "태그2"]
  }]
}
```

**출력 (멀티 씬)**
```json
{
  "scenarios": [{
    "id": "1",
    "title": "...",
    "recommendedSettings": {
      "aspectRatio": "9:16",
      "sceneCount": 4
    },
    "scenes": [{
      "sceneIndex": 0,
      "title": "씬 제목",
      "description": "씬 설명",
      "imageSummary": "이미지 요약 (한국어)",
      "videoSummary": "영상 요약 (한국어)",
      "firstFramePrompt": "English 80 words",
      "motionPromptEN": "English 40-50 words",
      "duration": 3,
      "movementAmplitude": "medium",
      "location": "장소",
      "mood": "분위기"
    }]
  }]
}
```

### 5.4 영상 생성 프롬프트

**입력**
| 변수 | 설명 |
|------|------|
| motionPromptEN | 영어 모션 설명 |
| startFrameDescription | 시작 프레임 |
| endFrameDescription | 끝 프레임 |
| mood | 분위기 |
| action | 동작 |
| duration | 영상 길이 |

**한국어 → 영어 변환**

| 동작 (한국어) | 영어 |
|--------------|------|
| 제품 들어보이기 | Lifting and presenting the product |
| 제품 사용하기 | Demonstrating the product usage |
| 제품 개봉하기 | Unboxing and revealing the product |

| 분위기 (한국어) | 영어 |
|----------------|------|
| 밝고 | bright and cheerful |
| 활기찬 | energetic and lively |
| 친근한 | friendly and approachable |
| 차분하고 | calm and relaxed |

---

## 6. Gemini API 연동 (lib/gemini/)

### 6.1 AI 아바타 프롬프트 (avatar-prompt.ts)

**함수:** `generateAiAvatarPrompt`

**입력**
| 필드 | 타입 |
|------|------|
| productInfo | string |
| productImageUrl | string? |
| targetGender | string |
| targetAge | string |
| style | string |
| ethnicity | string |
| bodyType | string |
| videoType | UGC/podcast/expert |
| cameraComposition | CameraCompositionType |
| modelPose | ModelPoseType |
| locationPrompt | string? |

**출력**
```json
{
  "prompt": "GPT-Image 프롬프트 (영어 50-100 words)",
  "avatarDescription": "아바타 설명 (한국어)",
  "locationDescription": "장소 설명 (한국어)"
}
```

### 6.2 영상 프롬프트 (video-prompt.ts)

#### generateVideoAdPrompts

**입력**
| 필드 | 설명 |
|------|------|
| productUrl | 제품 URL |
| productInfo | 제품 정보 |
| productImageUrl | 제품 이미지 |
| avatarImageUrl | 아바타 이미지 |
| duration | 5/10/15 |

**출력**
```json
{
  "productSummary": "제품 요약 (한국어)",
  "firstScenePrompt": "Seedream 프롬프트 (영어)",
  "videoPrompt": "영상 프롬프트 (영어)",
  "negativePrompt": "네거티브 (영어)"
}
```

#### generateProductScripts

**입력**
| 필드 | 설명 |
|------|------|
| productInfo | 제품 정보 |
| durationSeconds | 영상 길이 |
| language | ko/en/ja/zh |
| videoType | UGC/podcast/expert |

**출력**
```json
{
  "productSummary": "제품 요약",
  "scripts": [
    { "style": "formal", "content": "...", "estimatedDuration": 15 },
    { "style": "casual", "content": "...", "estimatedDuration": 15 },
    { "style": "energetic", "content": "...", "estimatedDuration": 15 }
  ],
  "recommendedOutfit": {
    "description": "의상 (영어)",
    "koreanDescription": "의상 (한국어)",
    "reason": "추천 이유"
  }
}
```

### 6.3 제품 정보 (product.ts)

#### summarizeProductInfo

**입력:** 제품 정보 (이름, 브랜드, 설명, 특징 등)

**출력**
```json
{
  "summary": "핵심 요약 2-3문장",
  "keyPoints": ["포인트1", "포인트2", "포인트3"],
  "suggestedTone": "추천 광고 톤"
}
```

#### extractProductFromUrl

**입력:** URL 문자열

**출력**
```json
{
  "title": "제품명",
  "brand": "브랜드",
  "description": "설명",
  "price": "가격",
  "features": ["특징"],
  "imageUrl": "이미지 URL"
}
```

### 6.4 시나리오 생성 (scenario.ts)

Structured Output 스키마 사용

**함수**
- `generateCompleteScenarios` - AI 추천 모드
- `generateMultiSceneScenarios` - 지정 씬 개수
- `generateSingleSceneScenarios` - 단일 씬

### 6.5 이미지 편집 (image-editing.ts)

#### mergeEditPrompt

**입력**
| 필드 | 설명 |
|------|------|
| originalPrompt | 원본 프롬프트 |
| userEditRequest | 사용자 편집 요청 |
| currentImageUrl | 현재 이미지 |

**출력**
```json
{
  "mergedPrompt": "Enhanced prompt (English)",
  "editSummary": "편집 요약 (한국어)"
}
```

---

## 7. 아바타 프롬프트 빌더 (lib/avatar/prompt-builder.ts)

### buildPromptFromOptions

옵션 기반으로 영어 프롬프트 생성

**옵션**
| 카테고리 | 필드 | 값 |
|----------|------|-----|
| 기본 | gender | female, male |
| | age | teen, early20s, late20s, 30s, 40plus |
| | ethnicity | korean, eastAsian, western, black, hispanic |
| 체형 | height | short, average, tall |
| | bodyType | slim, average, athletic, curvy, plussize |
| 외모 | hairStyle | longStraight, bob, wavy, ponytail, short |
| | hairColor | blackhair, brown, blonde, custom |
| | vibe | natural, sophisticated, cute, professional |
| 의상 | outfitStyle | casual, office, sporty, homewear |
| 환경 | background | studio, home, office, outdoor, cafe |
| | pose | model, natural, casual, working |

**체형 매핑 (성별별)**

| 체형 | 여성 | 남성 |
|------|------|------|
| slim | slim slender feminine silhouette | lean masculine frame |
| average | balanced feminine proportions | balanced masculine build |
| athletic | toned athletic feminine build | toned athletic masculine physique |
| curvy | feminine silhouette with natural soft curves | solid masculine build |

---

## 8. 금지 용어

### Seedream 금지 용어

```
taking a selfie, holding phone, smartphone, camera visible,
lighting equipment, light stand, softbox, studio light,
ring light visible, camera in frame, tripod visible
```

### 장비 네거티브 프롬프트

```
visible lighting equipment, light stand, softbox, studio light,
ring light, lamp, light fixture, visible camera, camera in frame,
tripod, camera lens, filming equipment, photography equipment
```

---

## 9. 이미지 광고 의상 옵션 (lib/gemini/image-ad-prompt-v2.ts)

### 의상 옵션 → 프롬프트 매핑

| 옵션 키 | 프롬프트 텍스트 |
|---------|----------------|
| keep_original | (원본 유지, 프롬프트 추가 안함) |
| casual_everyday | wearing casual everyday outfit: comfortable t-shirt or blouse with jeans, relaxed and approachable style |
| formal_elegant | wearing formal elegant outfit: sophisticated dress or tailored suit, refined and polished appearance |
| professional_business | wearing professional business attire: crisp blazer with dress shirt, polished and authoritative look |
| sporty_athletic | wearing sporty athletic wear: comfortable activewear or athleisure, energetic and dynamic style |
| cozy_comfortable | wearing cozy comfortable clothing: soft knit sweater or cardigan, warm and inviting appearance |
| trendy_fashion | wearing trendy fashion-forward outfit: current season styles, stylish and on-trend look |
| minimal_simple | wearing minimal simple outfit: clean solid-colored clothing without busy patterns, understated elegance |
| __custom__ | wearing {customText} (사용자 커스텀 입력) |

### 의상 적용 조건

```typescript
// 의상 지시가 프롬프트에 포함되는 조건:
1. adType !== 'productOnly' (모델이 있는 광고 유형)
2. !outfitImageUrl (의상 참조 이미지가 없음)
3. selectedOptions.outfit이 'keep_original'이 아님
```

### wearing 타입 특별 처리

```
wearing 타입에서는 제품이 의상인 경우가 많으므로,
outfit 옵션은 "제품 외의 다른 옷"을 설명하는 것임을 명시:

NOTE: This describes clothing OTHER than the product being worn.
      The advertised product must be worn as the main focus.
```

---

## 변경 이력

| 버전 | 날짜 | 설명 |
|------|------|------|
| 1.0.0 | 2025-01-16 | 프롬프트 중앙 관리 도입 |
| 1.1.0 | 2025-01-18 | 아바타 모션 프롬프트 추가 |
| 1.2.0 | 2025-01-21 | 멀티 씬 시나리오 지원 |
| 1.3.0 | 2025-01-23 | 숏폼 광고 스타일 최적화 |
| 1.4.0 | 2025-01-27 | 이미지 광고 의상 옵션 매핑 추가 |
