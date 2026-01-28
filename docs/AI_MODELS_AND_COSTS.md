# AIAD AI 모델 구성

> 마지막 업데이트: 2025-01-28

각 기능별 Primary/Fallback AI 모델 구성입니다.

---

## 1. 이미지 생성

| 기능 | Primary | Fallback | 소스 |
|------|---------|----------|------|
| **아바타 생성** | Kie.ai `z-image` | FAL.ai `fal-ai/z-image/turbo` | `app/api/avatars/route.ts` |
| **의상 교체** | FAL.ai `fal-ai/bytedance/seedream/v4.5/edit` | Kie.ai `seedream/4.5-edit` | `app/api/avatars/[id]/outfits/route.ts` |
| **이미지 광고** | FAL.ai `fal-ai/bytedance/seedream/v4.5/edit` | - | `app/api/image-ads/route.ts` |
| **키프레임 이미지** | Kie.ai `seedream/4.5-edit` | - | `app/api/product-ad/generate-keyframes/route.ts` |
| **배경 이미지** | Kie.ai `z-image` | - | `app/api/ad-backgrounds/route.ts` |
| **배경 제거** | Kie.ai `recraft/remove-background` | FAL.ai `smoretalk-ai/rembg-enhance` | `app/api/ad-products/route.ts` |

---

## 2. 영상 생성

| 기능 | Primary | Fallback | 소스 |
|------|---------|----------|------|
| **아바타 모션** | Kie.ai `kling-2.6/image-to-video` | - | `app/api/avatar-motion/generate-video/route.ts` |
| **제품 광고 (Seedance)** | Kie.ai `bytedance/seedance-1.5-pro` | - | `app/api/product-ad/generate-video/route.ts` |
| **제품 광고 (Wan)** | Kie.ai `wan/2-6-image-to-video` | - | `app/api/product-ad/generate-video/route.ts` |
| **씬 전환** | FAL.ai `fal-ai/kling-video/o1/standard/image-to-video` | - | `app/api/product-ad/generate-transitions/route.ts` |

---

## 3. 토킹 영상 (Lip-Sync)

| 기능 | Primary | Fallback | 소스 |
|------|---------|----------|------|
| **제품 설명 영상** | WaveSpeed `infinitetalk` | Kie.ai `kling/v1-avatar-standard` | `app/api/video-ads/product-description/generate-video/route.ts` |

---

## 4. 음성 (TTS)

| 기능 | Primary | Fallback | 소스 |
|------|---------|----------|------|
| **TTS** | WaveSpeed `minimax/speech-2.6-hd` | ElevenLabs `eleven_multilingual_v2` | `lib/tts/unified-service.ts` |

---

## 5. 음악

| 기능 | Primary | Fallback | 소스 |
|------|---------|----------|------|
| **광고 음악** | Kie.ai `Suno V5` | - | `app/api/ad-music/route.ts` |

---

## 6. LLM

| 기능 | Primary | Fallback | 소스 |
|------|---------|----------|------|
| **프롬프트 생성** | Google Gemini | - | `lib/gemini/` |

---

## 환경 변수

```bash
AVATAR_AI_PROVIDER=kie  # 아바타 생성: kie(기본) | fal
```

## API 키

| 환경 변수 | 서비스 |
|-----------|--------|
| `KIE_KEY` | Kie.ai |
| `FAL_KEY` | FAL.ai |
| `WAVE_SPEED_AI_KEY` | WaveSpeed AI |
| `ELEVENLABS_API_KEY` | ElevenLabs (Fallback) |
| `GOOGLE_AI_API_KEY` | Google Gemini |
