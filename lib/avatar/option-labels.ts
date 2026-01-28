/**
 * 아바타 옵션 한글 레이블
 *
 * 상세 페이지와 생성 폼에서 공유하여 일관된 텍스트를 표시합니다.
 */

// 성별 레이블
export const genderLabels: Record<string, string> = {
  female: '여성',
  male: '남성',
}

// 나이 레이블
export const ageLabels: Record<string, string> = {
  teen: '10대',
  early20s: '20대 초반',
  late20s: '20대 후반',
  '30s': '30대',
  '40plus': '40대 이상',
}

// 인종 레이블
export const ethnicityLabels: Record<string, string> = {
  asian: '아시아인',
  caucasian: '백인',
  black: '흑인',
  hispanic: '히스패닉',
}

// 키 레이블
export const heightLabels: Record<string, string> = {
  short: '작은 편',
  average: '보통',
  tall: '큰 편',
}

// 체형 레이블
export const bodyTypeLabels: Record<string, string> = {
  slim: '슬림',
  average: '보통',
  athletic: '운동형',
  curvy: '글래머',
  plussize: '플러스',
}

// 여성 헤어스타일 레이블
export const femaleHairStyleLabels: Record<string, string> = {
  longStraight: '롱스트레이트',
  longLayered: '레이어드컷',
  bob: '단발',
  shortBob: '숏단발',
  wavy: '웨이브',
  curly: '곱슬머리',
  ponytail: '포니테일',
  bun: '올림머리',
  halfUp: '반묶음',
  bangs: '앞머리 있는',
  pixie: '픽시컷',
}

// 남성 헤어스타일 레이블
export const maleHairStyleLabels: Record<string, string> = {
  maleShort: '숏컷',
  buzz: '버즈컷',
  twoBlock: '투블럭',
  undercut: '언더컷',
  pompadour: '포마드',
  slickedBack: '올백',
  sidePart: '사이드파트',
  maleWavy: '웨이브',
  maleMedium: '중간길이',
}

// 모든 헤어스타일 레이블 (통합)
export const hairStyleLabels: Record<string, string> = {
  ...femaleHairStyleLabels,
  ...maleHairStyleLabels,
}

// 머리색 레이블
export const hairColorLabels: Record<string, string> = {
  blackhair: '검정',
  brown: '갈색',
  blonde: '금발',
  custom: '커스텀',
}

// 의상 스타일 레이블
export const outfitStyleLabels: Record<string, string> = {
  tshirtJeans: '티셔츠 + 청바지',
  shirtSlacks: '셔츠 + 슬랙스',
  blouseSkirt: '블라우스 + 스커트',
  dress: '원피스',
  suit: '정장/수트',
  knitSweater: '니트/스웨터',
  athletic: '운동복/애슬레저',
  lounge: '홈웨어/라운지',
  jacket: '자켓/코트',
}

// 배경 레이블
export const backgroundLabels: Record<string, string> = {
  studioWhite: '스튜디오 (화이트)',
  studioGray: '스튜디오 (그레이)',
  home: '집/거실',
  office: '사무실',
  cafe: '카페',
  restaurant: '레스토랑',
  street: '거리/도심',
  park: '공원',
  beach: '해변',
  gym: '헬스장',
}

// 포즈 레이블
export const poseLabels: Record<string, string> = {
  standingFull: '서있는 전신',
  standingHalf: '서있는 상반신',
  sitting: '앉아있는',
  walking: '걷는 모습',
  leaning: '기대어 있는',
  armsCrossed: '팔짱',
  handsInPocket: '주머니에 손',
  holding: '물건 들고 있는',
}

// 옵션 값으로 레이블을 가져오는 헬퍼 함수
export function getOptionLabel(category: string, value: string): string {
  switch (category) {
    case 'gender':
      return genderLabels[value] || value
    case 'age':
      return ageLabels[value] || value
    case 'ethnicity':
      return ethnicityLabels[value] || value
    case 'height':
      return heightLabels[value] || value
    case 'bodyType':
      return bodyTypeLabels[value] || value
    case 'hairStyle':
      return hairStyleLabels[value] || value
    case 'hairColor':
      return hairColorLabels[value] || value
    case 'outfitStyle':
      return outfitStyleLabels[value] || value
    case 'background':
      return backgroundLabels[value] || value
    case 'pose':
      return poseLabels[value] || value
    default:
      return value
  }
}

// 헤어스타일 옵션 배열 (성별에 따라)
export const getHairStyleOptions = (gender: 'male' | 'female' | undefined) => {
  if (gender === 'male') {
    return Object.entries(maleHairStyleLabels).map(([value, label]) => ({
      value,
      label,
    }))
  }
  return Object.entries(femaleHairStyleLabels).map(([value, label]) => ({
    value,
    label,
  }))
}

// 각 카테고리의 옵션 배열
export const genderOptions = Object.entries(genderLabels).map(([value, label]) => ({ value, label }))
export const ageOptions = Object.entries(ageLabels).map(([value, label]) => ({ value, label }))
export const ethnicityOptions = Object.entries(ethnicityLabels).map(([value, label]) => ({ value, label }))
export const heightOptions = Object.entries(heightLabels).map(([value, label]) => ({ value, label }))
export const bodyTypeOptions = Object.entries(bodyTypeLabels).map(([value, label]) => ({ value, label }))
export const hairColorOptions = Object.entries(hairColorLabels).map(([value, label]) => ({ value, label }))
export const outfitStyleOptions = Object.entries(outfitStyleLabels).map(([value, label]) => ({ value, label }))
export const backgroundOptions = Object.entries(backgroundLabels).map(([value, label]) => ({ value, label }))
export const poseOptions = Object.entries(poseLabels).map(([value, label]) => ({ value, label }))
