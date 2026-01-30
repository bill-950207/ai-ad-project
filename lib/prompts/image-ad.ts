/**
 * 이미지 광고 프롬프트
 *
 * 이미지 광고 생성에 사용되는 프롬프트 템플릿들
 */

import { AVATAR_NEGATIVE_PROMPT, EQUIPMENT_NEGATIVE_PROMPT } from './common'

/** 네거티브 프롬프트 */
export const IMAGE_AD_NEGATIVE_PROMPT = AVATAR_NEGATIVE_PROMPT

/** 조명 효과 전용 가이드 (Gemini 프롬프트 생성 시 사용) */
export const LIGHTING_EFFECT_GUIDE = `
=== CRITICAL: LIGHTING DESCRIPTION RULES ===

IMPORTANT: When the user mentions ANY lighting terms (studio lighting, ring light, warm lighting, etc.):
- Describe ONLY the LIGHT EFFECT (direction, color temperature, quality, shadows)
- NEVER mention or include visible lighting EQUIPMENT in the scene
- The image should look like a natural photograph, NOT a behind-the-scenes or production photo

CORRECT LIGHTING DESCRIPTIONS (use these):
- "soft warm light from the left side creating gentle shadows"
- "bright even illumination with minimal shadows"
- "dramatic side lighting with strong contrast"
- "natural window light creating soft highlights"
- "professional commercial-quality lighting effect with controlled highlights"

WRONG LIGHTING DESCRIPTIONS (NEVER use these):
- "softbox on the left" (describes equipment)
- "ring light illuminating the face" (equipment visible)
- "studio lights around the model" (equipment in frame)
- "LED panel lighting" (equipment reference)
- "professional lighting setup" (implies visible equipment)

The generated image must show ONLY the RESULT of professional lighting, not the lighting equipment itself.
NO softboxes, NO light stands, NO ring lights, NO reflectors, NO any lighting equipment visible in the image.
`.trim()

/** 조명 장비 방지 강화 프롬프트 접미사 */
export const NO_LIGHTING_EQUIPMENT_SUFFIX = `CRITICAL: NO lighting equipment should be visible in the image. The scene must look like a natural photograph with professional lighting EFFECTS only - no softboxes, light stands, ring lights, LED panels, reflectors, or any production equipment visible. ${EQUIPMENT_NEGATIVE_PROMPT}`
