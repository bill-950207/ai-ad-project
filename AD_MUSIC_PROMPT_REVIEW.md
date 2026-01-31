# 광고 음악 프롬프트 검토 보고서 (Suno V5 기준)

## 1. Suno V5 공식 권장사항

### 1.1 프롬프트 구조 (권장 형식)

```
[장르] + [템포/느낌] + [악기 구성] + [보컬 의도] + [믹스 의도] + [분위기]
```

**예시:**
```
Celtic-inspired ambient instrumental with warm analog pads, soft harp arpeggios,
gentle low-whistle swells, slow atmospheric feel, airy spacious mix, no vocals
```

### 1.2 핵심 원칙

| 원칙 | 설명 |
|------|------|
| **4-7개 설명자** | 너무 적으면 generic, 너무 많으면 혼란 |
| **구체성** | "happy song" ❌ → "upbeat indie pop with bright guitar riffs" ✅ |
| **명확한 악기 지정** | 최소 3개 악기를 명확히 지정 |
| **Instrumental 명시** | `instrumental only` 또는 `no vocals` 반드시 포함 |

### 1.3 V5에서 개선된 점

- **Exclusion 정확도 향상**: `no vocals`가 V4.5보다 정확하게 작동
- **세부 프롬프트 반응성**: 더 구체적인 프롬프트에 잘 반응
- **Multiple exclusion 안정성**: 여러 제외 항목도 안정적

### 1.4 피해야 할 것

| 피해야 할 것 | 이유 |
|-------------|------|
| `cool`, `epic`, `radio-ready` 같은 모호한 단어 | V5는 정밀한 프롬프트 필요 |
| 한 단어 장르 (`rock`, `pop`) | 구체적 서브장르 사용 권장 |
| BPM 정확한 숫자 나열 | 범위(10-16 BPM)로 지정 권장 |

---

## 2. 현재 프롬프트 분석

### 현재 생성되는 프롬프트 (trendy + pop + cosmetics)

```
instrumental advertisement background music, commercial jingle style,
30 seconds duration, broadcast quality production, modern, fresh,
contemporary, stylish, cutting-edge, medium-fast tempo (100-120 BPM),
cool, urban, pop music, catchy melody, radio-friendly, mainstream,
synth pads, electronic drums, bass, bright keys, beauty advertisement,
luxurious feel, feminine elegance, glamorous, premium skincare,
clear intro, catchy hook, smooth ending, memorable melody, professional mix
```

### 문제점 분석

| 문제 | 현재 | Suno V5 권장 |
|------|------|-------------|
| 설명자 수 | 30개 이상 ⚠️ | 4-7개 |
| `cool` 사용 | 있음 ⚠️ | 피해야 함 |
| `radio-friendly` | 있음 ⚠️ | 모호한 단어 |
| 악기 지정 | 4개 (적절) | 최소 3개 ✅ |
| `instrumental` 명시 | 없음 ⚠️ | 필수 |
| 구조 | 나열식 | 권장 형식 미준수 |

### 키워드별 문제

```
❌ 모호한 단어: cool, urban, mainstream, radio-friendly, cutting-edge
❌ 중복: modern/contemporary/fresh, catchy melody/memorable melody
❌ 불필요: 30 seconds duration (API 파라미터), advertisement/commercial (분위기로 대체)
⚠️ 누락: "instrumental only" 또는 "no vocals"
```

---

## 3. 개선된 프롬프트 구조

### 3.1 Suno V5 최적화 형식

```typescript
function buildMusicStylePrompt(mood: string, genre: string, productType: string): string {
  // Suno V5 권장: 장르 + 템포 + 악기(3개+) + 분위기 + 믹스 + no vocals

  const genreMap: Record<string, string> = {
    pop: 'upbeat pop',
    electronic: 'electronic synth-pop',
    classical: 'orchestral cinematic',
    jazz: 'smooth jazz',
    rock: 'modern rock',
    hiphop: 'chill hip-hop beats',
    ambient: 'atmospheric ambient',
    acoustic: 'warm acoustic folk',
    lofi: 'lo-fi chill beats',
    cinematic: 'epic cinematic orchestral',
    rnb: 'smooth contemporary R&B',
    folk: 'acoustic folk storytelling',
  }

  const tempoMap: Record<string, string> = {
    bright: 'upbeat energetic tempo',
    calm: 'slow relaxed tempo',
    emotional: 'moderate building tempo',
    professional: 'steady confident tempo',
    exciting: 'fast driving tempo',
    trendy: 'medium-fast groove',
    playful: 'bouncy light tempo',
    romantic: 'slow intimate tempo',
    nostalgic: 'moderate warm tempo',
  }

  const instrumentMap: Record<string, string> = {
    pop: 'bright synths, punchy drums, warm bass',
    electronic: 'layered synthesizers, electronic beats, deep bass',
    classical: 'strings, piano, brass, woodwinds',
    jazz: 'piano, soft saxophone, upright bass',
    rock: 'electric guitar, drums, bass guitar',
    hiphop: '808 bass, crisp hi-hats, mellow keys',
    ambient: 'soft pads, subtle textures, gentle swells',
    acoustic: 'acoustic guitar, soft percussion, piano',
    lofi: 'mellow keys, vinyl crackle, soft drums',
    cinematic: 'full orchestra, percussion, choir pads',
    rnb: 'smooth synths, mellow bass, soft drums',
    folk: 'acoustic guitar, light percussion, harmonica',
  }

  const moodMap: Record<string, string> = {
    bright: 'cheerful uplifting feel',
    calm: 'peaceful soothing atmosphere',
    emotional: 'touching heartfelt mood',
    professional: 'sophisticated polished sound',
    exciting: 'dynamic powerful energy',
    trendy: 'modern fresh vibe',
    playful: 'fun lighthearted feel',
    romantic: 'tender dreamy atmosphere',
    nostalgic: 'warm sentimental mood',
  }

  const productMixMap: Record<string, string> = {
    cosmetics: 'elegant premium feel, clean mix',
    food: 'warm inviting atmosphere, natural sound',
    tech: 'sleek futuristic vibe, crisp production',
    fashion: 'stylish refined aesthetic, polished mix',
    health: 'fresh clean energy, clear sound',
    automobile: 'powerful dynamic presence, full mix',
    finance: 'trustworthy stable tone, balanced mix',
    lifestyle: 'friendly approachable feel, warm mix',
    sports: 'energetic motivating drive, punchy mix',
    kids: 'playful magical wonder, bright mix',
    pet: 'heartwarming gentle feel, soft mix',
    travel: 'adventurous open atmosphere, spacious mix',
  }

  const parts = [
    genreMap[genre] || genre,
    tempoMap[mood] || 'moderate tempo',
    instrumentMap[genre] || 'various instruments',
    moodMap[mood] || mood,
    productMixMap[productType] || 'professional mix',
    'instrumental only, no vocals',  // V5 필수
  ]

  return parts.join(', ')
}
```

### 3.2 예시 비교

#### trendy + pop + cosmetics

**현재 (~430자, 30+ 설명자):**
```
instrumental advertisement background music, commercial jingle style, 30 seconds duration, broadcast quality production, modern, fresh, contemporary, stylish, cutting-edge, medium-fast tempo (100-120 BPM), cool, urban, pop music, catchy melody, radio-friendly, mainstream, synth pads, electronic drums, bass, bright keys, beauty advertisement, luxurious feel, feminine elegance, glamorous, premium skincare, clear intro, catchy hook, smooth ending, memorable melody, professional mix
```

**개선 후 (~150자, 6개 핵심 요소):**
```
upbeat pop, medium-fast groove, bright synths, punchy drums, warm bass, modern fresh vibe, elegant premium feel, clean mix, instrumental only, no vocals
```

#### calm + ambient + health

**현재:**
```
instrumental advertisement background music, commercial jingle style, 30 seconds duration, broadcast quality production, relaxing, soothing, peaceful, gentle, tranquil, slow tempo (60-80 BPM), low energy, meditative, ambient, atmospheric, ethereal, spacious, dreamy, soft pads, reverb-heavy textures, subtle percussion, wellness commercial, fresh and clean, revitalizing energy, natural, healthy lifestyle, clear intro, catchy hook, smooth ending, memorable melody, professional mix
```

**개선 후:**
```
atmospheric ambient, slow relaxed tempo, soft pads, subtle textures, gentle swells, peaceful soothing atmosphere, fresh clean energy, clear sound, instrumental only, no vocals
```

---

## 4. 장르별 최적 템포 (Suno V5 기준)

| 장르 | 권장 BPM | 템포 설명어 |
|------|---------|------------|
| Lo-Fi | 70-84 | slow relaxed beats |
| Ambient | 60-80 | slow atmospheric |
| Jazz | 80-100 | moderate groovy |
| Folk | 84-100 | moderate storytelling |
| Acoustic | 80-100 | warm moderate |
| Cinematic | 88-110 | building dramatic |
| Pop | 100-120 | upbeat energetic |
| Electronic | 120-140 | driving electronic |
| Hip-Hop | 80-100 | rhythmic groove |
| Rock | 110-130 | driving powerful |

### 충돌 방지 로직

```typescript
// mood와 genre 템포가 충돌하면 장르 우선
function resolveTempoConflict(mood: string, genre: string): string {
  const genreTempoRange: Record<string, [number, number]> = {
    lofi: [70, 84],
    ambient: [60, 80],
    electronic: [120, 140],
    // ...
  }

  const moodTempoRange: Record<string, [number, number]> = {
    calm: [60, 80],
    exciting: [120, 140],
    // ...
  }

  // 장르 템포 우선, mood는 분위기로만 사용
  return genreTempoDescriptor[genre]
}
```

---

## 5. 최종 권장사항

### 5.1 필수 변경

| 항목 | 변경 내용 |
|------|----------|
| `instrumental only, no vocals` 추가 | V5 필수 |
| 설명자 수 제한 | 30+ → 6-8개 |
| 모호한 단어 제거 | `cool`, `urban`, `mainstream`, `radio-friendly` |
| 중복 제거 | `modern/contemporary/fresh` → `modern fresh` |
| 구조 정리 | Suno V5 권장 형식 준수 |

### 5.2 선택 변경

| 항목 | 이유 |
|------|------|
| `30 seconds duration` 제거 | API duration 파라미터 활용 |
| `advertisement` 직접 언급 제거 | 분위기로 대체 |
| BPM 숫자 제거 | 템포 형용사로 대체 |

### 5.3 기대 효과

| 지표 | 예상 개선 |
|------|----------|
| 프롬프트 길이 | 430자 → 150자 (65% 감소) |
| 설명자 수 | 30+ → 6-8개 (Suno V5 최적) |
| Instrumental 정확도 | 향상 (`no vocals` 명시) |
| 생성 일관성 | 향상 (모호함 제거) |

---

## 6. 참고 자료

- [Suno V5 Prompt Patterns That Never Miss](https://plainenglish.io/blog/i-made-10-suno-v5-prompt-patterns-that-never-miss)
- [Mastering Suno Prompts: The Ultimate 2025 Guide](https://skywork.ai/skypage/en/Mastering-Suno-Prompts:-The-Ultimate-2025-Guide-to-AI-Music-Creation/1975069867135528960)
- [Negative Prompting in Suno V5 Guide](https://jackrighteous.com/en-us/blogs/guides-using-suno-ai-music-creation/negative-prompting-suno-v5-guide)
- [AI Music Prompts Guide 2026: Suno Best Practices](https://musicsmith.ai/blog/ai-music-generation-prompts-best-practices)

---

*작성일: 2026-01-31*
*검토 대상: 광고 음악 AI 추천 프롬프트 (Suno V5)*
