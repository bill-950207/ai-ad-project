/**
 * 사용자별 데이터 캐싱 유틸리티
 *
 * unstable_cache + revalidateTag를 활용한 사용자별 데이터 캐싱
 * - 아바타, 제품, 이미지 광고, 영상 광고, 음악 등 목록 조회 캐싱
 * - 생성/삭제 시 revalidateTag로 무효화
 */

import { revalidateTag } from 'next/cache'

// 5분 기본 TTL
export const DEFAULT_USER_DATA_TTL = 300

/**
 * 사용자별 캐시 태그 생성
 */
export function getUserCacheTag(resource: string, userId: string): string {
  return `user-${resource}-${userId}`
}

/**
 * 페이지별 캐시 키 생성 (페이지네이션 지원)
 */
export function getPagedCacheKey(
  resource: string,
  userId: string,
  page: number,
  pageSize: number,
  filters?: Record<string, string | number | boolean | null>
): string[] {
  const filterStr = filters
    ? Object.entries(filters)
        .filter(([, v]) => v !== null && v !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}:${v}`)
        .join('-')
    : ''

  return [
    `${resource}-${userId}-p${page}-s${pageSize}${filterStr ? `-${filterStr}` : ''}`
  ]
}

/**
 * 사용자 데이터 캐시 무효화
 *
 * @param resource - 리소스 타입 (avatars, products, image-ads, video-ads, music)
 * @param userId - 사용자 ID
 */
export function invalidateUserCache(resource: string, userId: string): void {
  const tag = getUserCacheTag(resource, userId)
  revalidateTag(tag)
}

/**
 * 아바타 캐시 무효화
 */
export function invalidateAvatarsCache(userId: string): void {
  invalidateUserCache('avatars', userId)
}

/**
 * 제품 캐시 무효화
 */
export function invalidateProductsCache(userId: string): void {
  invalidateUserCache('products', userId)
}

/**
 * 이미지 광고 캐시 무효화
 */
export function invalidateImageAdsCache(userId: string): void {
  invalidateUserCache('image-ads', userId)
}

/**
 * 영상 광고 캐시 무효화
 */
export function invalidateVideoAdsCache(userId: string): void {
  invalidateUserCache('video-ads', userId)
}

/**
 * 음악 캐시 무효화
 */
export function invalidateMusicCache(userId: string): void {
  invalidateUserCache('music', userId)
}

/**
 * 쇼케이스 캐시 무효화 (관리자용)
 */
export function invalidateShowcasesCache(): void {
  revalidateTag('showcases')
}

/**
 * 음성 목록 캐시 무효화 (필요시 - 일반적으로 불필요)
 */
export function invalidateVoicesCache(): void {
  revalidateTag('voices')
}
