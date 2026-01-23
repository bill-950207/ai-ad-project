# 아바타 모션 시나리오 생성 프롬프트 가이드

## 개요

아바타 모션 영상 광고를 위한 **시네마틱 스타일** 시나리오 생성 LLM 프롬프트 문서입니다.
영화처럼 감성적이고 자연스러운 광고 영상을 생성합니다.

---

## 1. 핵심 철학: AI스러움 탈피

### 1.1 문제점 (기존 AI 생성 이미지)
- 균일하고 완벽한 피부 → **비현실적**
- 플랫한 조명, 그림자 없음 → **밋밋함**
- 과포화된 색상 → **인공적**
- 완벽한 대칭 → **로봇같음**
- 뻣뻣한 포즈 → **스톡 사진 느낌**

### 1.2 해결책 (시네마틱 접근)
- 자연스러운 피부 텍스처, 모공, 미세한 잔털 묘사
- **방향성 있는 조명** (항상 그림자 존재)
- 자연스러운 컬러 그레이딩
- 약간의 비대칭, 불완전함
- 캔디드한 순간 포착

---

## 2. 시네마틱 조명 가이드

### 2.1 조명 유형 (CRITICAL)

| 조명 | 영어 표현 | 특징 |
|------|-----------|------|
| **골든아워** | warm golden backlight from upper right creating rim light on hair | 따뜻한 역광, 머리카락에 후광 |
| **창가빛** | soft directional window light from left side, natural shadows | 한쪽 조명, 자연스러운 그림자 |
| **램프빛** | warm practical light from table lamp, pools of warm light | 따뜻한 점광원, 아늑함 |
| **새벽빛** | cool blue ambient transitioning to warm, soft diffused light | 차가운→따뜻한 톤 전환 |

### 2.2 조명 표현 규칙

```
✗ 나쁜 예: "well-lit room" (AI스러운 플랫 조명)
✓ 좋은 예: "warm golden light from upper left creating soft shadows on the right side of her face"
```

**필수 포함:**
- 빛의 방향 (from left, from behind, from above)
- 빛의 온도 (warm, cool, golden)
- 그림자 위치 (shadows on right side, gentle shadows)

---

## 3. 시네마틱 카메라 가이드

### 3.1 카메라 스타일

| 스타일 | 한국어 | 렌즈/조리개 | 특징 |
|--------|--------|-------------|------|
| `intimate-closeup` | 친밀한 클로즈업 | 35mm f/1.8 | 얼굴 70%, 얕은 심도 |
| `golden-hour` | 골든아워 | 50mm f/2.0 | 역광, 림라이트, 몽환적 |
| `window-light` | 창가 자연광 | 35mm f/2.8 | 측면광, 자연스러운 그림자 |
| `lifestyle-wide` | 라이프스타일 | 24mm f/4.0 | 환경 60%, 인물 40% |
| `over-shoulder` | 오버숄더 | 50mm f/1.8 | POV, 몰입감 |

### 3.2 카메라 표현 예시

```
✗ 나쁜 예: "photo of woman holding product"
✓ 좋은 예: "shot on 35mm lens at f/1.8, shallow depth of field with creamy bokeh,
          subject in left third of frame using rule of thirds"
```

---

## 4. 입력 파라미터

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `productName` | string | 제품명 |
| `productDescription` | string | 제품 설명 |
| `productSellingPoints` | string[] | 셀링 포인트 |
| `avatarDescription` | string | 아바타 설명 |
| `avatarType` | string | ai-generated / avatar / outfit |

---

## 5. 출력 스키마

### 5.1 시나리오 구조

```typescript
interface Scenario {
  id: string
  title: string                   // 시나리오 제목 (한국어, 8자)
  description: string             // 스토리 요약 (한국어, 20자)
  concept: string                 // 시네마틱 컨셉 (한국어, 2문장)
  productAppearance: string       // 제품 등장 방식 (한국어)
  mood: string                    // 감정적 톤 (한국어, 2단어)
  location: string                // 장소 (한국어)
  tags: string[]
  recommendedSettings: RecommendedSettings
  scenes: SceneInfo[]
}
```

### 5.2 씬 구조

```typescript
interface SceneInfo {
  sceneIndex: number
  title: string
  description: string
  imageSummary: string            // 한국어, 사용자 표시용
  videoSummary: string            // 한국어, 사용자 표시용
  firstFramePrompt: string        // 영어, 80-100 words
  motionPromptEN: string          // 영어, 50-70 words
  duration: number                // 3-4초 권장
  movementAmplitude: string
}
```

---

## 6. firstFramePrompt 작성 가이드

### 6.1 필수 포함 요소 (순서대로)

1. **LIGHTING** (가장 중요!)
   ```
   warm golden backlight from upper right creating rim light on hair
   ```

2. **CAMERA**
   ```
   shot on 35mm lens at f/1.8, shallow depth of field
   ```

3. **COMPOSITION**
   ```
   rule of thirds, face in left third of frame
   ```

4. **MODEL** (자연스러움 강조)
   ```
   natural relaxed pose, subtle contemplative expression
   ```

5. **SKIN TEXTURE** (AI 탈피 핵심!)
   ```
   natural skin texture with visible pores, subtle imperfections
   ```

6. **ENVIRONMENT**
   ```
   lived-in bedroom with rumpled white sheets
   ```

7. **COLOR GRADING**
   ```
   shot on film, natural color grading, warm tones
   ```

### 6.2 완성 예시

```
Young Asian woman in her late 20s in soft white linen pajamas, sitting on edge of bed
in moment of quiet contemplation. Warm golden morning light streaming from large window
on right side, creating soft rim light on her hair and gentle shadows on left side of face.
Shot on 35mm lens at f/1.8 with shallow depth of field, background softly blurred.
Natural skin texture with visible pores, subtle smile forming. She holds skincare product
loosely in both hands at lap level, gazing down at it with gentle curiosity.
Lived-in bedroom with rumpled white sheets, plant visible in soft focus background.
Shot on film, natural warm color grading.
```

---

## 7. motionPromptEN 작성 가이드

### 7.1 핵심 원칙

- **느린 움직임**: slowly, gently, gracefully
- **미세한 표현**: subtle smile, slight tilt, soft breath
- **자연스러운 리듬**: human breathing rhythm, natural pauses

### 7.2 구조

```
Starting state → Gentle movement → Subtle expression shift → Product interaction → Contemplative end
```

### 7.3 예시

```
She sits peacefully, chest rising with slow breath. Gently raises the product
toward her face, movement unhurried and deliberate. A subtle smile forms as
she examines it, head tilting slightly with curiosity. She brings it closer,
eyes softening with quiet contentment.
```

---

## 8. 감정적 톤 가이드

### 8.1 스토리 아키타입

| 아키타입 | 설명 | 시간대 | 조명 |
|----------|------|--------|------|
| 고요한 아침 | 평화로운 모닝 루틴 | 이른 아침 | 창가빛 |
| 황금빛 오후 | 노스탤직, 몽환적 | 해질녘 | 골든아워 |
| 친밀한 밤 | 아늑한 저녁 시간 | 저녁 | 램프빛 |
| 일상의 발견 | 작은 기쁨 포착 | 낮 | 자연광 |
| 나만의 시간 | 셀프케어 리추얼 | 아침/저녁 | 부드러운 조명 |

### 8.2 감정 표현

| 감정 | 영어 | 표현 방식 |
|------|------|-----------|
| 평온함 | Serenity | Slow breathing, soft gaze |
| 설렘 | Anticipation | Eyes brightening, lean forward |
| 만족감 | Contentment | Gentle smile, eyes closing |
| 자신감 | Confidence | Steady gaze, open posture |
| 여유로움 | Leisure | Unhurried movement |

---

## 9. 품질 체크리스트

### 9.1 Anti-AI 체크 (CRITICAL)

- [ ] 조명 방향이 명시되어 있는가?
- [ ] 피부 텍스처 묘사가 있는가?
- [ ] 얕은 심도가 명시되어 있는가? (f/1.8-2.8)
- [ ] "shot on film" 포함?
- [ ] 포즈가 자연스럽게 묘사되어 있는가?

### 9.2 기술적 체크

- [ ] firstFramePrompt: 영어, 80-100 words
- [ ] motionPromptEN: 영어, 50-70 words
- [ ] Scene duration: 3-4초
- [ ] Total duration: ≤15초

---

## 10. 모델별 프롬프트 최적화 가이드

### 10.1 Seedream 4.5 (이미지 생성)

Seedream 4.5는 자연어 프롬프트를 선호하며, 구체적이지만 간결한 설명이 최적의 결과를 만듭니다.

**권장 설정:**
- 프롬프트 길이: 50-80 words (최적: 65 words)
- 반드시 포함: 조명 방향, 카메라 스펙, 피부 텍스처

**카메라 스펙 권장:**
| 샷 타입 | 권장 설정 |
|---------|-----------|
| 포트레이트 | shot on 85mm lens at f/1.8 |
| 클로즈업 | shot on 50mm lens at f/2.0 |
| 환경샷 | shot on 35mm lens at f/2.8 |
| 풀바디 | shot on 24mm lens at f/4.0 |

**필수 Anti-AI 표현:**
```
natural skin texture with visible pores and subtle imperfections
natural hair with individual strands and flyaways
lived-in environment with authentic details
```

**품질 종결 태그:**
```
shot on film, natural color grading, photorealistic
```

### 10.2 Vidu Q2 (영상 생성)

Vidu Q2는 카메라 무브먼트 용어와 마이크로 표정 타이밍을 활용하면 더 자연스러운 영상이 생성됩니다.

**권장 설정:**
- 프롬프트 길이: 50-70 words (최적: 60 words)
- 움직임 강도는 프롬프트가 아닌 API의 `movement_amplitude` 파라미터 사용

**카메라 무브먼트 용어:**
| 영어 | 효과 |
|------|------|
| camera slowly dollies in | 천천히 다가가는 느낌 |
| slow zoom into face | 얼굴로 서서히 줌인 |
| static camera, subject moves naturally | 고정 카메라, 피사체만 움직임 |
| focus racks from background to subject | 배경→피사체로 포커스 이동 |
| camera orbits slowly to the left | 천천히 왼쪽으로 회전 |

**마이크로 표정 타이밍:**
```
natural blink around 2 seconds
subtle smile slowly forming
chest rises gently with natural breath
eyes drift naturally before settling
```

**움직임 표현 (시네마틱):**
- 느린 움직임: slowly, gracefully, gently, softly
- 일반 움직임: smoothly, naturally, steadily
- ⚠️ 빠른 움직임은 프롬프트에 쓰지 말고 `movement_amplitude: "large"` 사용

**프롬프트 구조 템플릿:**
```
[Starting state]. [Camera movement if any]. [Subject movement with timing].
[Expression transition]. [Product interaction]. [Final state]. [Atmospheric detail].
```

### 10.3 프롬프트 예시 (모델 최적화 적용)

**firstFramePrompt (Seedream 4.5):**
```
Young Asian woman in her late 20s in soft white linen pajamas, sitting on edge of bed
in moment of quiet contemplation. Warm golden morning light streaming from large window
on right side, creating soft rim light on her hair and gentle shadows on left side of face.
Shot on 35mm lens at f/1.8 with shallow depth of field, background softly blurred.
Natural skin texture with visible pores, subtle smile forming. She holds skincare product
loosely in both hands at lap level. Lived-in bedroom with rumpled white sheets.
Shot on film, natural color grading.
```

**motionPromptEN (Vidu Q2):**
```
She sits peacefully, chest rising gently with natural breath. Camera slowly dollies in.
Gently raises the product toward her face, movement unhurried and deliberate.
A subtle smile forms as she examines it. Natural blink around 2 seconds.
Head tilts slightly with curiosity. She brings it closer, eyes softening with
quiet contentment, settling into peaceful stillness.
```

---

## 11. 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| v1.0 | 2025-01-23 | UGC 스타일 초안 |
| v2.0 | 2025-01-23 | **시네마틱 스타일로 전면 개편** |
| v3.0 | 2025-01-23 | **Seedream 4.5 / Vidu Q2 모델별 최적화 가이드 추가** |
