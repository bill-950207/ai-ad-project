/**
 * 이미지 광고 카테고리 옵션 AI 자동 추천 API
 *
 * POST /api/image-ads/recommend-options
 * - 제품 정보와 광고 유형을 기반으로 최적의 카테고리 옵션 추천
 * - AI가 액션, 시선, 장소, 분위기 등 모든 설정을 자동으로 결정
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateRecommendedCategoryOptions } from '@/lib/gemini/client'
import { CATEGORY_OPTIONS } from '@/lib/image-ad/category-options'
import type { ImageAdType } from '@/components/ad-product/image-ad-type-modal'

// 옵션 키에 대한 한국어 설명 매핑
const OPTION_DESCRIPTIONS: Record<string, Record<string, string>> = {
  // 포즈 옵션
  pose: {
    natural_hold: '자연스럽게 들고 있는 포즈',
    showing_camera: '카메라에 제품을 보여주는 포즈',
    near_face: '얼굴 근처에서 제품을 들고 있는 포즈',
    both_hands: '양손으로 제품을 들고 있는 포즈',
    casual_hold: '캐주얼하게 제품을 들고 있는 포즈',
    standing: '서 있는 포즈',
    walking: '걷는 포즈',
    sitting: '앉아 있는 포즈',
    dynamic: '역동적인 포즈',
  },
  // 시선 옵션
  gaze: {
    camera: '카메라를 바라보는 시선',
    product: '제품을 바라보는 시선',
    away: '시선을 다른 곳으로 (자연스러운 캔디드)',
    down: '아래를 바라보는 시선',
    up: '위를 바라보는 시선',
  },
  // 배경 옵션
  background: {
    studio: '스튜디오 배경',
    studio_white: '순백색 스튜디오 배경',
    studio_gradient: '그라데이션 스튜디오 배경',
    outdoor: '야외 배경',
    home: '가정집 배경',
    office: '사무실 배경',
    cafe: '카페 배경',
    nature: '자연 배경',
    marble: '대리석 표면',
    wood: '나무 표면',
    fabric: '패브릭 배경',
    minimal: '미니멀 배경',
    white: '흰색 배경',
    gradient: '그라데이션 배경',
    neutral: '중립 톤 배경',
  },
  // 표정 옵션
  expression: {
    smile: '미소 짓는 표정',
    natural: '자연스러운 표정',
    confident: '자신감 있는 표정',
    friendly: '친근한 표정',
  },
  // 프레이밍 옵션
  framing: {
    closeup: '클로즈업 샷',
    medium: '미디엄 샷',
    full_body: '풀바디 샷',
    three_quarter: '3/4 샷',
    upper_body: '상반신 샷',
  },
  // 액션 옵션
  action: {
    applying: '제품을 바르는 동작',
    demonstrating: '제품 사용법을 보여주는 동작',
    enjoying: '제품을 즐기는 동작',
    testing: '제품을 테스트하는 동작',
    opening: '패키지를 여는 동작',
    revealing: '제품을 공개하는 동작',
    presenting: '제품을 소개하는 동작',
    excited: '흥분된 반응',
  },
  // 세팅 옵션
  setting: {
    bathroom: '욕실',
    vanity: '화장대',
    bedroom: '침실',
    desk: '책상',
    bed: '침대 위',
    couch: '소파 위',
    table: '테이블 위',
    street: '거리',
    indoor: '실내',
    studio: '스튜디오',
    nature: '자연',
  },
  // 장소 옵션
  location: {
    living_room: '거실',
    kitchen: '주방',
    bedroom: '침실',
    outdoor_terrace: '야외 테라스',
    coffee_shop: '커피숍',
  },
  // 씬 옵션
  scene: {
    morning_routine: '모닝 루틴',
    relaxing: '휴식 중',
    working: '일하는 중',
    socializing: '사교 활동',
    exercising: '운동 중',
  },
  // 시간 옵션
  time: {
    morning: '아침',
    afternoon: '오후',
    evening: '저녁',
    golden_hour: '골든 아워',
  },
  // 조명 옵션
  lighting: {
    soft: '부드러운 조명',
    natural: '자연광',
    dramatic: '드라마틱한 조명',
    warm: '따뜻한 조명',
    cool: '차가운 조명',
    consistent: '일관된 조명',
  },
  // 스타일 옵션
  style: {
    minimalist: '미니멀리스트',
    luxury: '럭셔리',
    lifestyle: '라이프스타일',
    editorial: '에디토리얼',
    commercial: '커머셜',
    streetwear: '스트리트웨어',
    elegant: '우아한',
    influencer: '인플루언서 스타일',
    professional: '프로페셔널',
    casual: '캐주얼',
    clean: '클린',
    detailed: '디테일한',
    infographic: '인포그래픽',
  },
  // 무드 옵션
  mood: {
    luxury: '럭셔리한 분위기',
    casual: '캐주얼한 분위기',
    professional: '전문적인 분위기',
    friendly: '친근한 분위기',
    energetic: '에너지 넘치는 분위기',
    cozy: '아늑한 분위기',
    vibrant: '활기찬 분위기',
    peaceful: '평화로운 분위기',
    sophisticated: '세련된 분위기',
    warm: '따뜻한 분위기',
    fresh: '상쾌한 분위기',
  },
  // 앵글 옵션
  angle: {
    front: '정면 앵글',
    three_quarter: '3/4 앵글',
    side: '측면 앵글',
    top_down: '탑다운 앵글',
    low_angle: '로우 앵글',
  },
  // 포커스 옵션
  focus: {
    product_focus: '제품 중심',
    model_focus: '모델 중심',
    balanced: '균형잡힌',
    skin: '피부 중심',
    hair: '헤어 중심',
    overall: '전체적',
  },
  // 레이아웃 옵션
  layout: {
    side_by_side: '나란히 배치',
    split_screen: '분할 화면',
    stacked: '세로 배치',
  },
  // 계절 옵션
  season: {
    spring: '봄',
    summer: '여름',
    fall: '가을',
    winter: '겨울',
  },
  // 테마 옵션
  theme: {
    holiday: '홀리데이',
    valentines: '발렌타인',
    new_year: '새해',
    festive: '축제',
    none: '없음',
  },
  // 분위기 옵션
  atmosphere: {
    warm: '따뜻한',
    fresh: '상쾌한',
    cozy: '아늑한',
    bright: '밝은',
  },
  // 제품 배치 옵션
  productPlacement: {
    none: '제품 없음',
    holding: '손에 들고',
    bag: '가방에',
    accessory: '액세서리로',
    nearby: '근처에 배치',
  },
}

export async function POST(request: NextRequest) {
  try {
    // Supabase 인증 확인
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      adType,
      productName,
      productDescription,
      language = 'ko',
    } = body

    if (!adType) {
      return NextResponse.json({ error: 'Ad type is required' }, { status: 400 })
    }

    // 해당 광고 유형의 카테고리 옵션 가져오기
    const categoryOptions = CATEGORY_OPTIONS[adType as ImageAdType]
    if (!categoryOptions) {
      return NextResponse.json({ error: 'Invalid ad type' }, { status: 400 })
    }

    // 카테고리 그룹 정보 추출 (설명 포함)
    const categoryGroups = categoryOptions.groups.map(group => ({
      key: group.key,
      options: group.options.map(opt => ({
        key: opt.key,
        description: OPTION_DESCRIPTIONS[group.key]?.[opt.key] || opt.labelKey,
      })),
    }))

    // AI로 최적 옵션 추천 요청
    const result = await generateRecommendedCategoryOptions({
      adType: adType as ImageAdType,
      productName,
      productDescription,
      categoryGroups,
      language,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('AI 자동 설정 오류:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}
