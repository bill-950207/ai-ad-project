/**
 * AI 추천 설정 프롬프트
 */

import { PromptTemplate } from '../types'
import { JSON_RESPONSE_INSTRUCTION } from '../common'

// ============================================================
// AI 추천 설정 생성 프롬프트
// ============================================================

/** AI 추천 설정 시스템 프롬프트 */
export const AI_RECOMMENDATION_SYSTEM = `You are an expert video production consultant specializing in short-form video ads.

Your task is to analyze the scenario/story and recommend optimal video settings:
1. Aspect ratio (9:16 for vertical/social, 16:9 for horizontal/youtube, 1:1 for square/instagram)
2. Number of scenes
3. Duration for each scene
4. Movement intensity for each scene

Consider:
- The story's pacing and emotional arc
- Platform best practices
- Product visibility requirements
- Model's actions and movements`

/** AI 추천 설정 템플릿 */
export const AI_RECOMMENDATION_TEMPLATE: PromptTemplate = {
  id: 'ai-recommendation-v1',
  name: 'AI 추천 설정',
  description: '시나리오에 맞는 최적의 영상 설정 추천',
  category: 'avatar-motion',
  targetModel: 'gemini',
  version: {
    version: '1.0.0',
    createdAt: '2025-01-21',
  },
  variables: [
    'scenarioTitle',
    'scenarioDescription',
    'scenarioConcept',
    'productCategory',
    'targetPlatform',
  ],
  template: `${AI_RECOMMENDATION_SYSTEM}

=== SCENARIO TO ANALYZE ===
Title: {{scenarioTitle}}
Description: {{scenarioDescription}}
Concept: {{scenarioConcept}}
Product Category: {{productCategory}}
Target Platform: {{targetPlatform}}

=== YOUR TASK ===

Analyze the scenario and recommend optimal video settings.

**ASPECT RATIO GUIDELINES:**
- "9:16": Best for TikTok, Instagram Reels, YouTube Shorts (vertical, mobile-first)
- "16:9": Best for YouTube, website embeds (horizontal, desktop-friendly)
- "1:1": Best for Instagram Feed, Facebook (square, versatile)

**SCENE COUNT GUIDELINES:**
- 2 scenes: Very short, punchy ads (10s or less)
- 3 scenes: Standard storytelling (10-18s)
- 4-5 scenes: Longer narratives (18-25s)

**DURATION PER SCENE:**
- 1-3s: Quick cuts, dynamic action
- 4-5s: Standard pacing
- 6-8s: Slow, emotional, showcase moments

**MOVEMENT AMPLITUDE:**
- "auto": Let the model decide
- "small": Subtle (talking, slight gestures)
- "medium": Normal (walking, reaching)
- "large": Dynamic (active movements)

=== OUTPUT FORMAT (JSON) ===
{
  "recommendation": {
    "aspectRatio": "9:16",
    "resolution": "720p",
    "sceneCount": 3,
    "sceneDurations": [4, 5, 6],
    "movementAmplitudes": ["medium", "medium", "small"],
    "reasoning": "추천 이유를 한국어로 설명 (2-3문장). 왜 이 설정이 이 시나리오에 적합한지."
  }
}

=== REASONING GUIDELINES ===
Explain in Korean:
- Why this aspect ratio fits the platform and content
- Why this scene structure works for the story
- How the pacing supports the narrative arc

${JSON_RESPONSE_INSTRUCTION}`,
}

/** AI 추천 설정 프롬프트 빌드 */
export function buildAIRecommendationPrompt(
  scenarioTitle: string,
  scenarioDescription: string,
  scenarioConcept: string,
  productCategory: string,
  targetPlatform: string = '소셜 미디어 (인스타그램, 틱톡)'
): string {
  return AI_RECOMMENDATION_TEMPLATE.template
    .replace('{{scenarioTitle}}', scenarioTitle)
    .replace('{{scenarioDescription}}', scenarioDescription)
    .replace('{{scenarioConcept}}', scenarioConcept)
    .replace('{{productCategory}}', productCategory || '일반 소비재')
    .replace('{{targetPlatform}}', targetPlatform)
}
