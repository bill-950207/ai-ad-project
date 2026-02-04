/**
 * UI 상수 정의
 *
 * 전체 애플리케이션에서 사용되는 UI 관련 상수들을 중앙에서 관리합니다.
 */

// ===== 그리드 & 페이지네이션 =====
export const GRID = {
  /** 기본 페이지당 아이템 수 */
  ITEMS_PER_PAGE: 16,
  /** 대시보드 갤러리 기본 아이템 수 */
  GALLERY_ITEMS: 8,
  /** 최근 항목 표시 개수 */
  RECENT_ITEMS: 4,
} as const;

// ===== 애니메이션 =====
export const ANIMATION = {
  /** 페이드 인/아웃 지속 시간 (ms) */
  FADE_DURATION: 200,
  /** 줌 애니메이션 지속 시간 (ms) */
  ZOOM_DURATION: 200,
  /** 슬라이드 애니메이션 지속 시간 (ms) */
  SLIDE_DURATION: 300,
  /** 토스트 기본 표시 시간 (ms) */
  TOAST_DURATION: 5000,
  /** 에러 토스트 표시 시간 (ms) */
  TOAST_ERROR_DURATION: 7000,
  /** cascade 애니메이션 지연 간격 (ms) */
  STAGGER_DELAY: 75,
  /** 쇼케이스 레인 기본 속도 (초) */
  SHOWCASE_RAIN_SPEED: 20,
} as const;

// ===== 반응형 브레이크포인트 =====
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// ===== 모달 사이즈 =====
export const MODAL_SIZES = {
  SM: 'max-w-sm',
  MD: 'max-w-md',
  LG: 'max-w-lg',
  XL: 'max-w-xl',
  FULL: 'max-w-[calc(100vw-2rem)]',
} as const;

// ===== Z-Index 레이어 =====
export const Z_INDEX = {
  /** 기본 콘텐츠 */
  BASE: 0,
  /** 드롭다운 메뉴 */
  DROPDOWN: 10,
  /** 스티키 헤더 */
  STICKY: 20,
  /** 사이드바/네비게이션 */
  NAV: 30,
  /** 모달/다이얼로그 */
  MODAL: 50,
  /** 토스트 알림 */
  TOAST: 100,
  /** 최상위 오버레이 */
  OVERLAY: 9999,
} as const;

// ===== 최대 길이 제한 =====
export const MAX_LENGTH = {
  /** 제목 최대 길이 */
  TITLE: 100,
  /** 설명 최대 길이 */
  DESCRIPTION: 500,
  /** 파일명 최대 길이 */
  FILENAME: 255,
  /** 검색어 최대 길이 */
  SEARCH_QUERY: 100,
} as const;

// ===== 이미지 관련 =====
export const IMAGE = {
  /** 썸네일 최대 높이 */
  THUMBNAIL_MAX_HEIGHT: 256,
  /** 기본 이미지 품질 */
  DEFAULT_QUALITY: 80,
  /** 압축 이미지 품질 */
  COMPRESSED_QUALITY: 75,
} as const;

// ===== 스켈레톤 기본 설정 =====
export const SKELETON = {
  /** 기본 카드 개수 */
  DEFAULT_CARD_COUNT: 8,
  /** 리스트 기본 행 개수 */
  DEFAULT_LIST_ROWS: 5,
  /** 테이블 기본 행 개수 */
  DEFAULT_TABLE_ROWS: 5,
  /** 테이블 기본 열 개수 */
  DEFAULT_TABLE_COLS: 4,
} as const;

// ===== 접근성 =====
export const A11Y = {
  /** 포커스 링 색상 클래스 */
  FOCUS_RING: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  /** 스크린 리더 전용 클래스 */
  SR_ONLY: 'sr-only',
} as const;

// ===== 드롭다운/팝오버 =====
export const POPOVER = {
  /** 드롭다운 최대 높이 */
  MAX_HEIGHT: 256,
  /** 검색 드롭다운 최대 높이 */
  SEARCH_MAX_HEIGHT: 320,
  /** 드롭다운 오프셋 */
  OFFSET: 8,
} as const;
