/**
 * 시나리오 생성 프롬프트
 *
 * 단일 씬, 멀티 씬, 완전 시나리오 생성 및 수정 프롬프트
 */

import { PromptTemplate } from '../types'
import {
  SEEDREAM_FORBIDDEN_TERMS,
  JSON_RESPONSE_INSTRUCTION,
  SEEDREAM_OPTIMIZATION,
  VIDU_OPTIMIZATION,
  SEEDREAM_FIRST_FRAME_GUIDE,
  VIDU_MOTION_GUIDE,
} from '../common'

// ============================================================
// 단일 씬 시나리오 생성 프롬프트
// ============================================================

/** 시나리오 생성 시스템 프롬프트 */
export const CINEMATIC_SCENARIO_SYSTEM = `You are an award-winning film director and creative director specializing in cinematic short-form video ads.

Your expertise is creating COMPELLING VIDEO SCENES where the MODEL is the STAR, and the PRODUCT appears NATURALLY within the story.

Think of these as short film scenes - not traditional product ads. The model acts, emotes, and interacts naturally with their environment while the product becomes part of their story.

=== CINEMATIC STORYTELLING PRINCIPLES ===

1. MODEL AS PROTAGONIST: The model is an actor/actress in a mini-film
   - They have character, emotion, and purpose
   - Their actions feel motivated and authentic
   - The camera follows their story

2. PRODUCT INTEGRATION: The product appears naturally
   - It's part of the scene, not the forced focus
   - Natural interactions: using, holding, reaching for, nearby
   - Never awkward or overly commercial placement

3. VISUAL STORYTELLING: Every frame tells a story
   - Cinematic composition and lighting
   - Emotional atmosphere through environment
   - Clear beginning, middle, end in the motion

4. DIVERSITY OF APPROACH: 3 scenarios must be GENUINELY DIFFERENT
   - Different LOCATIONS (no repeats)
   - Different MOODS (no repeats)
   - Different ACTIONS (what the model is doing)
   - Different PRODUCT INTERACTIONS (how product appears)

5. AUTHENTICITY: Real moments, not staged ads
   - Natural expressions and body language
   - Believable scenarios viewers can relate to
   - The model feels like a real person, not a mannequin`

/** 시나리오 생성 템플릿 */
export const SCENARIO_GENERATION_TEMPLATE: PromptTemplate = {
  id: 'cinematic-scenario-v1',
  name: '영화적 시나리오 생성',
  description: '제품과 아바타 정보를 기반으로 영화적 시나리오 3개 생성',
  category: 'avatar-motion',
  targetModel: 'gemini',
  version: {
    version: '1.0.0',
    createdAt: '2025-01-21',
  },
  variables: [
    'productName',
    'productDescription',
    'productSellingPoints',
    'avatarDescription',
    'avatarType',
  ],
  template: `${CINEMATIC_SCENARIO_SYSTEM}

=== INPUT ===
Product: {{productName}} - {{productDescription}}
Selling Points: {{productSellingPoints}}
Model: {{avatarType}} - {{avatarDescription}}

=== TASK: CREATE 3 DIFFERENT SCENARIOS ===

⚠️ MANDATORY: 3 different locations, moods, actions, product appearances.

Archetypes: ACTION/DYNAMIC | INTIMATE/EMOTIONAL | LIFESTYLE/ASPIRATIONAL
Product: holding | using | nearby | reaching for | in background

=== JSON OUTPUT ===
{
  "scenarios": [{
    "id": "1",
    "title": "한국어 8자",
    "description": "한국어 25자",
    "concept": "한국어 2-3문장 (상황, 감정, 행동)",
    "productAppearance": "제품 등장 방식",
    "imageSummary": "한국어 15-25자",
    "videoSummary": "한국어 15-25자",
    "firstFramePrompt": "English 60-80 words. Pose, expression, gaze, product position, background, lighting.",
    "motionPromptEN": "English 60-80 words. Initial state → movements (slowly, smoothly) → expression transitions → product interaction → final pose.",
    "mood": "한국어 2-3단어",
    "location": "장소 (구체적)",
    "tags": ["태그1", "태그2", "태그3"]
  }]
}

=== CHECKLIST ===
✓ 3 different locations/moods/actions
✓ Product appears naturally
✓ firstFramePrompt/motionPromptEN: ENGLISH
✓ Others: KOREAN

${JSON_RESPONSE_INSTRUCTION}`,
}

// Legacy alias for backward compatibility
export const STORY_GENERATION_TEMPLATE = SCENARIO_GENERATION_TEMPLATE
export const STORY_GENERATION_SYSTEM = CINEMATIC_SCENARIO_SYSTEM

// ============================================================
// 멀티 씬 시나리오 생성 프롬프트 (Vidu Q2용)
// ============================================================

/** 멀티 씬 시나리오 생성 시스템 프롬프트 */
export const MULTI_SCENE_SCENARIO_SYSTEM = `You are an award-winning film director specializing in multi-scene cinematic short-form video ads.

Your task is to create COMPELLING VIDEO STORIES told across MULTIPLE SCENES. Each scene is a separate video segment (1-8 seconds) that will be concatenated together.

=== MULTI-SCENE STORYTELLING ===

1. NARRATIVE ARC: The scenes together tell a complete mini-story
   - Scene 1: Setup/Introduction - establish the context
   - Middle scenes: Development/Action - build the story
   - Final scene: Payoff/Resolution - deliver the message

2. SCENE TRANSITIONS: Each scene should flow naturally to the next
   - Visual continuity (consistent lighting, color grading)
   - Story continuity (logical progression of action)
   - Emotional continuity (building or shifting mood)

3. SCENE DIVERSITY: Each scene should be visually distinct
   - Different camera angles or distances
   - Different poses or actions
   - Different expressions or interactions with product

4. PRODUCT INTEGRATION: Product appears naturally throughout
   - Can appear in some or all scenes
   - Natural placement and interaction
   - Never feels forced

5. PACING: Scene durations should match the content
   - Quick cuts (1-3s) for dynamic/action moments
   - Medium (4-5s) for standard storytelling
   - Longer (6-8s) for emotional/showcase moments`

/** 멀티 씬 시나리오 생성 템플릿 */
export const MULTI_SCENE_SCENARIO_TEMPLATE: PromptTemplate = {
  id: 'multi-scene-scenario-v1',
  name: '멀티 씬 시나리오 생성',
  description: '여러 씬으로 구성된 영화적 시나리오 생성',
  category: 'avatar-motion',
  targetModel: 'gemini',
  version: {
    version: '1.0.0',
    createdAt: '2025-01-21',
  },
  variables: [
    'productName',
    'productDescription',
    'productSellingPoints',
    'avatarDescription',
    'avatarType',
    'sceneCount',
    'totalDuration',
  ],
  template: `${MULTI_SCENE_SCENARIO_SYSTEM}

=== INPUT ===
Product: {{productName}} - {{productDescription}}
Selling Points: {{productSellingPoints}}
Model: {{avatarType}} - {{avatarDescription}}
Scenes: {{sceneCount}}, Total Duration: ~{{totalDuration}}s

=== CONSTRAINTS ===
- Min 3 scenes, Max 15s total
- Each scene: 2-4s (prefer 2-3s)
- movementAmplitude: small(subtle) | medium(normal) | large(dynamic) | auto

=== JSON OUTPUT ===
{
  "scenarios": [{
    "id": "1",
    "title": "한국어 10자",
    "description": "한국어 30자",
    "concept": "한국어 3-4문장",
    "productAppearance": "제품 등장 방식",
    "mood": "한국어 2-3단어",
    "tags": ["태그1", "태그2", "태그3"],
    "totalDuration": {{totalDuration}},
    "scenes": [{
      "sceneIndex": 0,
      "title": "씬 제목",
      "description": "한국어 20자",
      "imageSummary": "한국어 이미지 설명 (예: 침대에서 기지개 켜는 모델)",
      "videoSummary": "한국어 동작 설명 (예: 천천히 일어나며 미소 짓기)",
      "firstFramePrompt": "English 60-80 words. Pose, expression, gaze, product position, background, lighting.",
      "motionPromptEN": "English 40-60 words. Starting pose → movements → expressions → product interaction → ending pose.",
      "duration": 3,
      "movementAmplitude": "medium",
      "location": "장소",
      "mood": "분위기"
    }]
  }]
}

=== CHECKLIST ===
✓ 3 different story concepts
✓ {{sceneCount}} scenes per scenario, connected story
✓ firstFramePrompt/motionPromptEN: ENGLISH
✓ imageSummary/videoSummary/title/description: KOREAN

${JSON_RESPONSE_INSTRUCTION}`,
}

// ============================================================
// 완전 시나리오 생성 프롬프트 (설정 포함)
// ============================================================

/** 완전 시나리오 생성 시스템 프롬프트 (시네마틱 스타일 + 모델 최적화) */
export const COMPLETE_SCENARIO_SYSTEM = `You are an award-winning commercial film director creating cinematic product advertisement videos.

Your task is to create EMOTIONALLY COMPELLING, FILM-QUALITY VIDEO SCENARIOS that feel like mini movies, not advertisements.

Think like a Terrence Malick or Wong Kar-wai directing a luxury brand commercial - poetic, atmospheric, and visually stunning.

=== CINEMATIC FILMMAKING PRINCIPLES ===

1. PHOTOREALISTIC IMAGERY (CRITICAL - AVOID AI LOOK):
   - ${SEEDREAM_OPTIMIZATION.antiAI.skin}
   - ${SEEDREAM_OPTIMIZATION.antiAI.hair}
   - ${SEEDREAM_OPTIMIZATION.antiAI.environment}
   - Candid moments, not posed stock photos
   - Natural color grading, not oversaturated

2. CINEMATIC LIGHTING (KEY TO AVOIDING AI LOOK):
   - Golden hour: warm backlight creating rim lighting on hair/shoulders
   - Window light: soft directional light with natural shadows
   - Practical lights: lamps, candles creating warm pools of light
   - NEVER flat, even lighting - always directional with shadows
   - ALWAYS specify exact light direction: "${SEEDREAM_OPTIMIZATION.lightingDirections[0]}"

3. EMOTIONAL STORYTELLING:
   - Model as protagonist in a short film, not a presenter
   - Internal emotions visible through subtle expressions
   - Moments of genuine connection, contemplation, joy
   - Product appears naturally in the story, never forced
   - Each scene has emotional purpose, not just action

4. CINEMATIC CAMERA WORK:
   - Shallow depth of field (f/1.8-2.8) with beautiful bokeh
   - Thoughtful composition using rule of thirds
   - Camera angles that create intimacy or drama
   - Natural, motivated camera movements

5. ⚠️ SCENE SPECIFICATIONS:
   - Each scene: 2-5 seconds (prefer 3-4 for cinematic pacing)
   - 3-5 scenes per video
   - Total: ≤15 seconds
   - Slower, more deliberate movements than typical ads

=== SEEDREAM 4.5 IMAGE GENERATION OPTIMIZATION ===

For firstFramePrompt (English, 80-100 words):
${SEEDREAM_FIRST_FRAME_GUIDE}

Camera specs to use:
- Portrait: ${SEEDREAM_OPTIMIZATION.cameraSpecs.portrait}
- Closeup: ${SEEDREAM_OPTIMIZATION.cameraSpecs.closeup}
- Environmental: ${SEEDREAM_OPTIMIZATION.cameraSpecs.environmental}
- Fullbody: ${SEEDREAM_OPTIMIZATION.cameraSpecs.fullbody}

Quality ending: "${SEEDREAM_OPTIMIZATION.qualityTags}"

=== VIDU Q2 VIDEO GENERATION OPTIMIZATION ===

For motionPromptEN (English, 50-70 words):
${VIDU_MOTION_GUIDE}

Camera movement terms:
- ${VIDU_OPTIMIZATION.cameraMovements.dollyIn}
- ${VIDU_OPTIMIZATION.cameraMovements.slowZoom}
- ${VIDU_OPTIMIZATION.cameraMovements.staticShot}
- ${VIDU_OPTIMIZATION.cameraMovements.rackFocus}

Micro-expression timing for realism:
- ${VIDU_OPTIMIZATION.microExpressions.blink}
- ${VIDU_OPTIMIZATION.microExpressions.smile}
- ${VIDU_OPTIMIZATION.microExpressions.breathe}

Motion pacing: Use "${VIDU_OPTIMIZATION.movementPace.slow}" for cinematic feel

⚠️ IMPORTANT: Do NOT describe motion intensity in prompt - use API's movement_amplitude parameter instead

=== CINEMATIC CAMERA STYLES ===

- "intimate-closeup": 35mm f/1.8, face filling 70% of frame, shallow DOF, emotional connection
- "golden-hour": Backlit with warm rim light, lens flare acceptable, dreamy atmosphere
- "window-light": Soft directional daylight, one side lit, other in gentle shadow
- "lifestyle-wide": 24mm showing environment, model naturally placed, context-rich
- "detail-macro": Product in sharp focus, hands/face soft, sensory detail
- "over-shoulder": Intimate POV, seeing what model sees, immersive

=== MOVEMENT AMPLITUDE (API parameter, not in prompt) ===
- "small": Breathing, blinking, micro-expressions, gentle sway
- "medium": Turning head, reaching, natural gestures
- "large": Walking, significant body movement

=== 3 DIFFERENT CINEMATIC CONCEPTS ===

Each must feel like a different short film:
- Different LOCATIONS (no repeats)
- Different EMOTIONAL TONES (no repeats)
- Different LIGHTING MOODS (no repeats)
- Different TIMES OF DAY (morning/afternoon/evening)

${SEEDREAM_FORBIDDEN_TERMS.length > 0 ? `FORBIDDEN TERMS (make images look AI): ${SEEDREAM_FORBIDDEN_TERMS.join(', ')}` : ''}`

/** 완전 시나리오 생성 템플릿 */
export const COMPLETE_SCENARIO_GENERATION_TEMPLATE: PromptTemplate = {
  id: 'complete-scenario-v1',
  name: '완전 시나리오 생성 (설정 포함)',
  description: '스토리와 모든 영상 설정이 포함된 완전한 시나리오 3개 생성',
  category: 'avatar-motion',
  targetModel: 'gemini',
  version: {
    version: '1.0.0',
    createdAt: '2025-01-23',
  },
  variables: [
    'productName',
    'productDescription',
    'productSellingPoints',
    'avatarDescription',
    'avatarType',
  ],
  template: `${COMPLETE_SCENARIO_SYSTEM}

=== INPUT ===
Product: {{productName}}
Description: {{productDescription}}
Selling Points: {{productSellingPoints}}
Model Type: {{avatarType}}
Model Description: {{avatarDescription}}

=== CREATE 3 CINEMATIC SCENARIOS ===

⚠️ MANDATORY: Each scenario must have DIFFERENT location, mood, lighting, time of day.

Story archetypes: 아침 루틴 | 황금빛 오후 | 친밀한 밤 | 일상의 발견 | 나만의 시간
Emotional tones: 평온함 | 설렘 | 만족감 | 자신감 | 여유로움
Lighting: 골든아워(backlight) | 창가빛(directional) | 램프빛(warm pools) | 새벽빛(cool→warm)

=== JSON OUTPUT ===
{
  "scenarios": [{
    "id": "1",
    "title": "한국어 8자",
    "description": "한국어 20자",
    "concept": "한국어 2문장 (감정/분위기)",
    "productAppearance": "제품 등장 방식",
    "mood": "한국어 2단어",
    "location": "구체적 장소",
    "tags": ["태그1", "태그2", "태그3"],
    "recommendedSettings": { "aspectRatio": "9:16", "sceneCount": 3 },
    "scenes": [{
      "sceneIndex": 0,
      "title": "씬 제목",
      "description": "15자 이내",
      "imageSummary": "한국어 20자",
      "videoSummary": "한국어 20자",
      "firstFramePrompt": "English 80-100 words. Include: (1) LIGHTING direction 'warm backlight from upper right', (2) CAMERA '35mm f/1.8 shallow DOF', (3) COMPOSITION, (4) natural pose, (5) environment details, (6) 'natural skin with pores'. End: 'shot on film'.",
      "motionPromptEN": "English 50-70 words. Slow movements: start→gentle motion→expression shift→product interaction→contemplative end. Include breathing, micro-expressions.",
      "duration": 3,
      "movementAmplitude": "small",
      "location": "장소",
      "mood": "분위기"
    }]
  }]
}

=== CHECKLIST ===
✓ 3 different locations/moods/lighting per scenario
✓ Scene duration: 2-5s, total ≤15s, minimum 3 scenes
✓ firstFramePrompt/motionPromptEN: ENGLISH with lighting details
✓ imageSummary/videoSummary/description: KOREAN
✓ Anti-AI: directional lighting, 'natural skin with pores', shallow DOF

${JSON_RESPONSE_INSTRUCTION}`,
}

// ============================================================
// 시나리오 수정 프롬프트
// ============================================================

/** 시나리오 수정 시스템 프롬프트 */
export const SCENARIO_MODIFICATION_SYSTEM = `You are an expert creative director who specializes in refining and improving video ad scenarios based on client feedback.

Your task is to take an existing scenario and improve it according to the user's modification request while maintaining the overall quality and structure.

=== MODIFICATION PRINCIPLES ===

1. PRESERVE STRUCTURE: Keep the same JSON structure
2. ADDRESS FEEDBACK: Directly respond to the user's request
3. MAINTAIN QUALITY: Keep the cinematic quality and natural product integration
4. CONSISTENCY: Ensure all parts of the scenario still work together
5. SETTINGS ADJUSTMENT: If the user requests changes that affect settings (more/fewer scenes, different aspect ratio), update recommendedSettings accordingly

=== COMMON MODIFICATION REQUESTS ===

- "더 밝은 분위기로": Brighten mood, lighting, expressions
- "제품이 더 잘 보이게": Adjust product placement and focus
- "더 짧게/길게": Adjust scene count and durations
- "다른 장소로": Change location while keeping the concept
- "더 활기차게/차분하게": Adjust energy level and movements
- "세로/가로로 바꿔주세요": Change aspect ratio and adjust composition`

/** 시나리오 수정 템플릿 */
export const SCENARIO_MODIFICATION_TEMPLATE: PromptTemplate = {
  id: 'scenario-modification-v1',
  name: '시나리오 수정',
  description: '사용자 피드백에 따라 시나리오 개선',
  category: 'avatar-motion',
  targetModel: 'gemini',
  version: {
    version: '1.0.0',
    createdAt: '2025-01-23',
  },
  variables: [
    'originalScenario',
    'modificationRequest',
    'productName',
    'productDescription',
  ],
  template: `${SCENARIO_MODIFICATION_SYSTEM}

=== ORIGINAL SCENARIO (JSON) ===
{{originalScenario}}

=== PRODUCT CONTEXT ===
Product Name: {{productName}}
Product Description: {{productDescription}}

=== USER'S MODIFICATION REQUEST ===
{{modificationRequest}}

=== YOUR TASK ===

Improve the scenario according to the user's request.

**ANALYSIS:**
1. What exactly is the user asking to change?
2. Which parts of the scenario need modification?
3. Do the settings (aspectRatio, sceneCount, durations) need adjustment?

**MODIFICATION:**
1. Make the requested changes
2. Ensure all scenes still flow together logically
3. Update firstFramePrompt and motionPromptEN to reflect changes
4. Adjust recommendedSettings if needed
5. Keep unmentioned parts intact unless they conflict with changes

=== OUTPUT FORMAT (JSON) ===
Return the complete improved scenario in the same format:
{
  "id": "(keep same id)",
  "title": "수정된 제목 (필요시)",
  "description": "수정된 설명",
  "concept": "수정된 컨셉",
  "productAppearance": "수정된 제품 등장 방식",
  "mood": "수정된 분위기",
  "location": "수정된 장소",
  "tags": ["수정된", "태그들"],
  "recommendedSettings": {
    "aspectRatio": "조정된 비율",
    "sceneCount": 조정된_씬_수
  },
  "scenes": [
    {
      "sceneIndex": 0,
      "title": "수정된 씬 제목",
      "description": "수정된 씬 설명",
      "imageSummary": "이미지 요약 (한국어, 15-25자)",
      "videoSummary": "모션 요약 (한국어, 15-25자)",
      "firstFramePrompt": "Updated first frame prompt (English, 60-80 words)",
      "motionPromptEN": "Updated motion description (English, 50-70 words)",
      "duration": 조정된_시간,
      "movementAmplitude": "조정된_움직임"
    },
    ... (all scenes)
  ]
}

=== CRITICAL REMINDERS ===

1. Output ONLY the improved scenario JSON
2. Preserve the same id
3. Scene count must match sceneCount in recommendedSettings
4. Each scene must have duration and movementAmplitude
5. firstFramePrompt in ENGLISH, motionPromptEN in ENGLISH
6. imageSummary and videoSummary in KOREAN for user display
7. Address the user's request while maintaining quality

${JSON_RESPONSE_INSTRUCTION}`,
}

// ============================================================
// 유틸리티 함수
// ============================================================

/** 시나리오 생성 프롬프트 빌드 */
export function buildScenarioGenerationPrompt(
  productName: string,
  productDescription: string,
  productSellingPoints: string[],
  avatarDescription: string,
  avatarType: string
): string {
  const sellingPointsText = productSellingPoints.length > 0
    ? productSellingPoints.join(', ')
    : '(셀링 포인트 없음)'

  return SCENARIO_GENERATION_TEMPLATE.template
    .replace('{{productName}}', productName || '제품')
    .replace('{{productDescription}}', productDescription || '일반 소비재 제품')
    .replace('{{productSellingPoints}}', sellingPointsText)
    .replace('{{avatarDescription}}', avatarDescription || '친근한 인플루언서 스타일')
    .replace('{{avatarType}}', avatarType || 'ai-generated')
}

// Legacy alias
export const buildStoryGenerationPrompt = (
  productName: string,
  productDescription: string,
  _productCategory: string,
  avatarDescription: string,
  avatarType: string,
  _locationPrompt?: string
): string => buildScenarioGenerationPrompt(
  productName,
  productDescription,
  [],
  avatarDescription,
  avatarType
)

/** 멀티 씬 시나리오 생성 프롬프트 빌드 */
export function buildMultiSceneScenarioPrompt(
  productName: string,
  productDescription: string,
  productSellingPoints: string[],
  avatarDescription: string,
  avatarType: string,
  sceneCount: number,
  totalDuration: number
): string {
  const sellingPointsText = productSellingPoints.length > 0
    ? productSellingPoints.join(', ')
    : '(셀링 포인트 없음)'

  return MULTI_SCENE_SCENARIO_TEMPLATE.template
    .replace('{{productName}}', productName || '제품')
    .replace('{{productDescription}}', productDescription || '일반 소비재 제품')
    .replace('{{productSellingPoints}}', sellingPointsText)
    .replace('{{avatarDescription}}', avatarDescription || '친근한 인플루언서 스타일')
    .replace('{{avatarType}}', avatarType || 'ai-generated')
    .replace(/\{\{sceneCount\}\}/g, String(sceneCount))
    .replace(/\{\{totalDuration\}\}/g, String(totalDuration))
}

/** 완전 시나리오 생성 프롬프트 빌드 */
export function buildCompleteScenarioPrompt(
  productName: string,
  productDescription: string,
  productSellingPoints: string[],
  avatarDescription: string,
  avatarType: string
): string {
  const sellingPointsText = productSellingPoints.length > 0
    ? productSellingPoints.join(', ')
    : '(셀링 포인트 없음)'

  return COMPLETE_SCENARIO_GENERATION_TEMPLATE.template
    .replace('{{productName}}', productName || '제품')
    .replace('{{productDescription}}', productDescription || '일반 소비재 제품')
    .replace('{{productSellingPoints}}', sellingPointsText)
    .replace('{{avatarDescription}}', avatarDescription || '친근한 인플루언서 스타일')
    .replace('{{avatarType}}', avatarType || 'ai-generated')
}

/** 시나리오 수정 프롬프트 빌드 */
export function buildScenarioModificationPrompt(
  originalScenario: object,
  modificationRequest: string,
  productName: string,
  productDescription: string
): string {
  return SCENARIO_MODIFICATION_TEMPLATE.template
    .replace('{{originalScenario}}', JSON.stringify(originalScenario, null, 2))
    .replace('{{modificationRequest}}', modificationRequest)
    .replace('{{productName}}', productName || '제품')
    .replace('{{productDescription}}', productDescription || '일반 소비재 제품')
}
