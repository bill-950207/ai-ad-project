# 이미지 광고 프롬프트 개선 비교

## 기존 프롬프트 핵심 요소 (보존 필수)

### 1. Figure 참조 시스템 ✅
```
- Figure 1: Avatar/Model reference
- Figure 2: Product reference
- 모델은 "the model from Figure 1"으로만 참조
- 제품은 "the product from Figure 2"로만 참조
- 물리적 외모 묘사 금지
```

### 2. 조명 규칙 ✅
```
CORRECT: "soft warm light from the left creating gentle shadows"
WRONG: "softbox on the left" (장비 언급)
WRONG: "ring light illuminating" (장비 언급)
WRONG: "studio lights around the model" (장비 언급)
```

### 3. 모델 표정 가이드 ✅
```
- Natural, relaxed expression - NOT forced or exaggerated smile
- Avoid typical "AI smile"
- Candid, authentic human expression
- Eyes should convey genuine emotion
```

### 4. 제품 외관 보존 ✅
```
- Preserve exact COLOR (same hue, saturation, tone)
- Preserve exact SHAPE and FORM
- Preserve exact TEXTURE and MATERIAL
- DO NOT modify or stylize
```

### 5. 로고 분석 및 처리 ✅
```
Step 1: 제품에 로고/텍스트가 있는지 분석 → productHasLogo
Step 2a: 있으면 → "preserve existing markings only"
Step 2b: 없으면 → "keep surface clean, no added logos/text/barcodes"
```

### 6. 오버레이 방지 ✅
```
- NO logo banners
- NO text overlays
- NO barcodes or QR codes
- NO product tags or price labels
- NO decorative frames or borders
- NO UI elements
```

### 7. 체형 보존 ✅
```
- Preserve EXACT body proportions from avatar reference
- DO NOT exaggerate or enhance body features
- Body type hint for consistency, NOT enhancement
```

### 8. 상업 광고 스타일 ✅
```
- Professional studio-quality lighting EFFECT
- Magazine-worthy composition
- High-end brand advertisement quality
- Premium, polished atmosphere
```

---

## 기존 프롬프트 문제점 (제거/개선 대상)

### 1. 중복 지시 ❌
```
조명 장비 금지가 3곳에서 언급:
- LIGHTING DESCRIPTION RULES 섹션
- COMMERCIAL ADVERTISEMENT STYLE 섹션
- 후처리에서 다시 추가

로고/오버레이 금지가 4곳에서 언급:
- LOGO & TEXT RULES 섹션
- PROMPT GENERATION RULES 섹션
- NO GRAPHIC OVERLAYS 섹션
- 후처리에서 다시 추가
```

### 2. 네거티브 프롬프트 무효 ❌
```
${PRODUCT_NEGATIVE_PROMPT}
${OVERLAY_NEGATIVE_PROMPT}
${EQUIPMENT_NEGATIVE_PROMPT}

→ Seedream 4.5는 네거티브 프롬프트 지원이 약함
→ 포지티브 지시로 통합해야 효과적
```

### 3. 후처리 과도함 ❌
```
LLM이 이미 생성한 프롬프트에 100+ words 추가:
- overlayPrevention (35 words)
- lightingEquipmentPrevention (30 words)
- NO_LOGO_PROMPT_SUFFIX (50 words)
- holdingReinforcement (20 words)
```

### 4. 출력 지시 복잡 ❌
```
"optimizedPrompt" 설명이 100+ words로 너무 김
→ LLM이 지시를 따르기 어려움
```

---

## 개선 방향

### 원칙
1. **핵심 지시는 100% 보존** - 조명, 표정, 제품 보존, 로고 처리, 오버레이 방지
2. **중복만 제거** - 같은 내용을 여러 번 언급하지 않음
3. **후처리 최소화** - LLM이 이미 잘 따랐다면 추가하지 않음
4. **출력 길이 명확화** - 60-80 words로 명확히 제한

### 구조 개선
```
기존: 7개 섹션, 113줄
개선: 4개 섹션, 50줄

[섹션 1] 역할 + 광고 유형 + Figure 참조 (10줄)
[섹션 2] 핵심 규칙 통합 - 조명/표정/제품/로고/오버레이 (25줄)
[섹션 3] 체형 보존 (조건부, 5줄)
[섹션 4] 출력 형식 (10줄)
```

### 후처리 개선
```
기존: 무조건 100+ words 추가
개선: 누락된 경우에만 최소한 추가 (단어 수 체크)
```
