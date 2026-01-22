# 제품 광고 아바타 기능 개선 계획

## 현재 문제점 분석

### 1. 아바타 강제 포함 문제
첨부된 이미지를 보면, 신발 광고에서 모델이 어색하게 포함되어 있습니다:
- 모델이 신발을 바라보며 몸을 숙인 부자연스러운 구도
- 제품(신발)보다 모델이 시각적으로 더 눈에 띔
- "보조 역할"이라는 의도와 달리 모델이 주인공처럼 보임

**원인 분석:**
1. Seedream 4.5에 제품 이미지와 아바타 이미지를 함께 전달하면, AI가 두 이미지를 모두 포함시키려고 함
2. 프롬프트에서 "model is SUPPORTING element"라고 해도, 이미지 참조가 있으면 AI가 포함시킴
3. 씬별로 아바타 포함 여부를 명확히 구분하지 않음

### 2. AI 추천 아바타 부재
- 다른 위자드(이미지 광고, 아바타 모션)에는 AI 추천 기능이 있음
- 제품 광고에서는 어떤 아바타가 적합한지 AI가 추천해주지 않음
- 제품에 따라 "아바타 없이 제품만"이 더 나은 경우도 있음

---

## 개선 계획

### A. AI 추천 아바타 기능 추가

#### A-1. 새 API 엔드포인트 생성
**파일:** `app/api/product-ad/recommend-avatar/route.ts`

```typescript
interface RecommendAvatarRequest {
  productName: string
  productDescription?: string
  productCategory?: string
  productImageUrl?: string
}

interface AvatarRecommendation {
  shouldUseAvatar: boolean  // 아바타 사용 권장 여부
  reason: string            // 추천 이유
  recommendations?: {
    gender: 'male' | 'female' | 'any'
    ageRange: string        // e.g., "20-30대"
    style: string           // e.g., "세련된 비즈니스", "캐주얼 트렌디"
    intensity: 'subtle' | 'moderate'  // 등장 강도
  }
  alternativeStrategy?: string  // 아바타 없이 할 경우 제안
}
```

**추천 로직:**
- 제품 유형 분석 (화장품→얼굴 클로즈업 적합, 신발→제품 중심 적합)
- 타겟 고객층 추정
- 아바타 사용 시 장단점 분석
- 3가지 시나리오 제안:
  1. 아바타 없이 제품만
  2. 손/부분만 등장
  3. 모델 포함

#### A-2. wizard-step-1.tsx UI 업데이트
- 아바타 선택 섹션에 "AI 추천" 버튼 추가
- AI 추천 결과를 카드 형태로 표시
- 추천 이유 표시 (예: "신발 광고는 제품 중심이 효과적입니다")

---

### B. 아바타 등장 강도 설정 추가

#### B-1. 새 상태 추가 (wizard-context.tsx)
```typescript
export type AvatarIntensity = 'none' | 'subtle' | 'moderate'

// 'none': 아바타 이미지 전달 안함, 프롬프트에서 사람 제외
// 'subtle': 손/부분만 등장, 얼굴 제외
// 'moderate': 모델 포함 가능, 단 제품이 주인공
```

#### B-2. wizard-step-1.tsx에 강도 선택 UI 추가
아바타 선택 후 하단에 표시:
```
아바타 등장 방식:
[ 손만 등장 ] [ 부분만 등장 (얼굴 제외) ] [ 자연스럽게 등장 ]
     ⭐추천           보통                    주의필요
```

---

### C. 프롬프트 및 이미지 전달 로직 개선

#### C-1. generate-multi-scene 프롬프트 수정 (route.ts)

**현재 문제:**
```
=== CRITICAL RULES ===
❌ ABSOLUTELY NO PEOPLE:
- NO humans, faces, hands, body parts, silhouettes
```
이 규칙과 아바타 섹션이 충돌함.

**개선안:**
```typescript
// avatarIntensity에 따라 다른 프롬프트 생성
function buildMultiScenePrompt(..., avatarInfo, avatarIntensity) {
  // avatarIntensity === 'none' 또는 !avatarInfo
  if (!avatarInfo || avatarIntensity === 'none') {
    // 기존 "NO PEOPLE" 규칙 유지
    return buildProductOnlyPrompt(...)
  }

  // avatarIntensity === 'subtle'
  if (avatarIntensity === 'subtle') {
    return buildSubtleAvatarPrompt(...)
    // 손만 등장, 얼굴/몸 제외
    // "elegant hands holding the product", "hands entering frame"
  }

  // avatarIntensity === 'moderate'
  return buildModerateAvatarPrompt(...)
  // 모델 포함 가능하나 제품 중심
}
```

#### C-2. generate-keyframes 이미지 전달 로직 수정 (route.ts)

**현재 문제:**
아바타 이미지가 선택되면 모든 씬에 전달됨:
```typescript
const imageUrls = avatarImageUrl
  ? [productImageUrl, avatarImageUrl]  // 항상 둘 다 전달
  : [productImageUrl]
```

**개선안:**
```typescript
// 씬별로 아바타 포함 여부 결정
const imageUrlsForScene = (scene: SceneInput) => {
  // 프롬프트에 아바타/모델/손 언급이 있는 경우에만 아바타 이미지 포함
  const includesModel = scene.scenePrompt.toLowerCase().includes('hand') ||
                       scene.scenePrompt.toLowerCase().includes('model') ||
                       scene.scenePrompt.toLowerCase().includes('person')

  if (includesModel && avatarImageUrl && avatarIntensity !== 'none') {
    return [productImageUrl, avatarImageUrl]
  }
  return [productImageUrl]
}
```

#### C-3. 씬 분리 전략

**현재:** 모든 씬에 동일한 이미지 배열 전달

**개선안:** 씬별 역할 명확히 구분
```typescript
// generate-multi-scene 응답 스키마 수정
interface SceneOutput {
  index: number
  scenePrompt: string
  duration: number
  movementAmplitude: string
  includesModel: boolean  // 새 필드: 이 씬에 모델 포함 여부
  modelUsage?: 'hands_only' | 'partial_body' | 'with_face'  // 모델 사용 방식
}
```

프롬프트에서 명확히 지시:
```
For each scene, you must decide:
- includesModel: true/false - whether this scene includes ANY human element
- If includesModel is true, specify modelUsage:
  - 'hands_only': Only hands visible, holding/touching product
  - 'partial_body': Shoulder, back, silhouette (no face)
  - 'with_face': Face can be visible but product remains hero

⚠️ CRITICAL: At least ${sceneCount - 1} scenes MUST have includesModel: false
Only 1 scene should include the model to maintain product focus.
```

---

### D. 대체 접근법: 씬별 이미지 생성 분리

더 근본적인 해결책으로, 아바타 포함 씬과 제품 전용 씬을 완전히 분리:

```typescript
// 1단계: 제품 전용 씬 생성 (아바타 이미지 제외)
const productOnlyScenes = scenes.filter(s => !s.includesModel)
const productKeyframes = await generateKeyframes({
  productImageUrl,
  avatarImageUrl: null,  // 아바타 이미지 전달 안함
  scenes: productOnlyScenes,
})

// 2단계: 아바타 포함 씬 생성 (아바타 이미지 포함)
const modelScenes = scenes.filter(s => s.includesModel)
const modelKeyframes = await generateKeyframes({
  productImageUrl,
  avatarImageUrl,
  scenes: modelScenes,
})
```

---

## 구현 우선순위

1. **[높음]** C-3: 씬별 `includesModel` 필드 추가 및 이미지 전달 로직 분리
   - 가장 큰 문제(강제 포함)를 해결

2. **[높음]** B: 아바타 강도 설정 추가
   - 사용자가 명시적으로 제어 가능

3. **[중간]** A: AI 추천 아바타 기능
   - UX 개선, 사용자 가이드

4. **[낮음]** D: 씬 분리 생성
   - 고급 최적화

---

## 예상 작업량

- A (AI 추천): API 1개 + UI 업데이트 1개
- B (강도 설정): Context 수정 + UI 추가 + API 수정
- C (프롬프트/로직): API 2개 수정 (generate-multi-scene, generate-keyframes)
- D (씬 분리): wizard-step-5.tsx 수정

총 예상: 주요 파일 5-7개 수정
