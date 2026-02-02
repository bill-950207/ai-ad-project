/**
 * 쇼케이스 데이터 타입
 */
export interface ShowcaseData {
  id: string
  type: 'image' | 'video'
  thumbnail_url: string
  media_url: string | null
  title: string
  description: string | null
  ad_type: string | null
  category: string | null
  product_image_url: string | null
  avatar_image_url: string | null
}
