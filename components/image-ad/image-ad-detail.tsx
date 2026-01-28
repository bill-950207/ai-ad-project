/**
 * 이미지 광고 상세 컴포넌트
 *
 * 생성된 이미지 광고와 관련 제품, 아바타, 옵션 정보를 표시합니다.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/language-context'
import {
  ArrowLeft,
  Trash2,
  Download,
  ExternalLink,
  Loader2,
  Image as ImageIcon,
  Package,
  User,
  Shirt,
  Settings2,
  Wand2,
  Star,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ImageEditModal } from './image-edit-modal'

interface AdProduct {
  id: string
  name: string
  image_url: string | null
  rembg_image_url: string | null
}

interface Avatar {
  id: string
  name: string
  image_url: string | null
}

interface Outfit {
  id: string
  name: string
  image_url: string | null
}

interface SelectedOptions {
  pose?: string
  gaze?: string
  background?: string
  expression?: string
  framing?: string
  lighting?: string
  angle?: string
  style?: string
  action?: string
  setting?: string
  focus?: string
  scene?: string
  location?: string
  time?: string
  mood?: string
  layout?: string
  season?: string
  theme?: string
  atmosphere?: string
  productPlacement?: string
  // DB에서 nested object가 포함될 수 있음 (ai_avatar_options 등)
  [key: string]: string | Record<string, unknown> | undefined
}

interface ImageAd {
  id: string
  image_url: string | null  // WebP 압축본 (리스트/미리보기용)
  image_url_original: string | null  // 원본 PNG (다운로드용)
  image_urls: string[] | null  // 배치 이미지 URL 배열 (압축본)
  image_url_originals: string[] | null  // 배치 원본 이미지 URL 배열
  num_images: number | null  // 요청된 이미지 개수
  ad_type: string
  status: string
  prompt: string | null
  image_size: string | null
  quality: string | null
  selected_options: SelectedOptions | null
  created_at: string
  product_id: string | null
  avatar_id: string | null
  outfit_id: string | null
  ad_products: AdProduct | null
  avatars: Avatar | null
  avatar_outfits: Outfit | null
}

interface ImageAdDetailProps {
  imageAdId: string
}

export function ImageAdDetail({ imageAdId }: ImageAdDetailProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [imageAd, setImageAd] = useState<ImageAd | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isDownloadingAll, setIsDownloadingAll] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [isDeletingSingle, setIsDeletingSingle] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isRegisteringShowcase, setIsRegisteringShowcase] = useState(false)

  // 어드민 권한 확인
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          setIsAdmin(profile?.role === 'ADMIN')
        }
      } catch (error) {
        console.error('권한 확인 오류:', error)
      }
    }
    checkAdmin()
  }, [])

  const fetchImageAd = useCallback(async () => {
    try {
      const res = await fetch(`/api/image-ads/${imageAdId}`)
      if (res.ok) {
        const data = await res.json()
        setImageAd(data.imageAd)
      } else {
        router.push('/dashboard/image-ad')
      }
    } catch (error) {
      console.error('이미지 광고 조회 오류:', error)
      router.push('/dashboard/image-ad')
    } finally {
      setIsLoading(false)
    }
  }, [imageAdId, router])

  useEffect(() => {
    fetchImageAd()
  }, [fetchImageAd])

  const handleDelete = async () => {
    if (!confirm(t.imageAdDetail?.confirmDelete || '이 이미지 광고를 삭제하시겠습니까?')) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/image-ads/${imageAdId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.push('/dashboard/image-ad')
      }
    } catch (error) {
      console.error('삭제 오류:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  // 하위 호환성: image_urls가 없으면 image_url로 배열 생성
  const imageUrls = imageAd?.image_urls || (imageAd?.image_url ? [imageAd.image_url] : [])
  const originalUrls = imageAd?.image_url_originals || (imageAd?.image_url_original ? [imageAd.image_url_original] : [])
  const hasMultipleImages = imageUrls.length > 1

  // 선택된 이미지 URL
  const selectedImageUrl = imageUrls[selectedImageIndex] || null
  const selectedOriginalUrl = originalUrls[selectedImageIndex] || selectedImageUrl

  const handleDownload = async (index?: number) => {
    const idx = index ?? selectedImageIndex
    // 원본 URL이 있으면 원본(PNG) 다운로드, 없으면 압축본(WebP) 다운로드
    const downloadUrl = originalUrls[idx] || imageUrls[idx]
    if (!downloadUrl) return

    try {
      const res = await fetch(downloadUrl)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      // 원본은 PNG, 압축본은 WebP
      const extension = originalUrls[idx] ? 'png' : 'webp'
      const suffix = hasMultipleImages ? `_${idx + 1}` : ''
      a.download = `image-ad-${imageAdId}${suffix}.${extension}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('다운로드 오류:', error)
    }
  }

  const handleDownloadAll = async () => {
    if (imageUrls.length === 0) return
    setIsDownloadingAll(true)

    try {
      // 모든 이미지 순차 다운로드
      for (let i = 0; i < imageUrls.length; i++) {
        await handleDownload(i)
        // 브라우저가 연속 다운로드를 처리할 수 있도록 약간의 딜레이
        if (i < imageUrls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
    } finally {
      setIsDownloadingAll(false)
    }
  }

  // 쇼케이스 등록 (어드민 전용)
  const handleRegisterShowcase = async () => {
    if (!imageAd || !selectedImageUrl) return

    if (!confirm('이 이미지 광고를 쇼케이스로 등록하시겠습니까?')) return

    setIsRegisteringShowcase(true)
    try {
      const res = await fetch('/api/admin/showcases/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'image',
          adId: imageAd.id,
          title: imageAd.ad_products?.name || '이미지 광고',
          description: imageAd.prompt?.slice(0, 200) || null,
          thumbnailUrl: selectedImageUrl,
          mediaUrl: selectedOriginalUrl,
          adType: imageAd.ad_type,
          category: imageAd.ad_products?.name || null,
          productImageUrl: imageAd.ad_products?.rembg_image_url || imageAd.ad_products?.image_url || null,
          avatarImageUrl: imageAd.avatars?.image_url || null,
        }),
      })

      if (res.ok) {
        alert('쇼케이스로 등록되었습니다.')
      } else {
        const data = await res.json()
        alert(data.error || '등록에 실패했습니다.')
      }
    } catch (error) {
      console.error('쇼케이스 등록 오류:', error)
      alert('등록 중 오류가 발생했습니다.')
    } finally {
      setIsRegisteringShowcase(false)
    }
  }

  const handleDeleteSingleImage = async (index: number) => {
    // 마지막 하나 남은 이미지는 삭제 불가
    if (imageUrls.length <= 1) {
      alert(t.imageAdDetail?.cannotDeleteLastImage || '마지막 이미지는 삭제할 수 없습니다.')
      return
    }

    if (!confirm(t.imageAdDetail?.confirmDeleteSingleImage || '이 이미지를 삭제하시겠습니까?')) return

    setIsDeletingSingle(true)
    try {
      const res = await fetch(`/api/image-ads/${imageAdId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteIndex: index }),
      })

      if (res.ok) {
        // 삭제 후 데이터 새로고침
        await fetchImageAd()
        // 삭제된 이미지가 현재 선택된 이미지였으면 이전 이미지 또는 첫 이미지로 이동
        if (index === selectedImageIndex) {
          setSelectedImageIndex(Math.max(0, index - 1))
        } else if (index < selectedImageIndex) {
          // 삭제된 이미지가 선택된 이미지보다 앞이면 인덱스 조정
          setSelectedImageIndex(selectedImageIndex - 1)
        }
      } else {
        const data = await res.json()
        alert(data.error || '이미지 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('이미지 삭제 오류:', error)
      alert('이미지 삭제에 실패했습니다.')
    } finally {
      setIsDeletingSingle(false)
    }
  }

  // 이미지 개수에 따른 썸네일 그리드 클래스
  const getThumbnailGridClass = (count: number) => {
    if (count <= 3) return 'grid-cols-3'
    if (count === 4) return 'grid-cols-4'
    return 'grid-cols-5'
  }

  const getAdTypeTitle = (adType: string): string => {
    const types = t.imageAdTypes as Record<string, { title?: string }>
    return types?.[adType]?.title || adType
  }

  const getQualityLabel = (quality: string | null): string => {
    if (!quality) return '-'
    const qualityOptions = (t.imageAdCreate as Record<string, unknown>)?.qualityOptions as Record<string, { label?: string }> | undefined
    return qualityOptions?.[quality]?.label || quality
  }

  const getAspectRatioLabel = (size: string | null): string => {
    if (!size) return '-'
    const ratios = (t.imageAdCreate as Record<string, unknown>)?.aspectRatios as Record<string, string> | undefined
    // Convert size format (e.g., "square_hd" -> "1:1")
    const sizeToRatio: Record<string, string> = {
      'square_hd': '1:1',
      'landscape_16_9': '16:9',
      'portrait_9_16': '9:16',
    }
    const ratio = sizeToRatio[size] || size
    return ratios?.[ratio] || ratio
  }

  // 옵션 그룹 라벨
  const optionGroupLabels: Record<string, string> = {
    pose: '포즈',
    gaze: '시선',
    background: '배경',
    expression: '표정',
    framing: '프레이밍',
    lighting: '조명',
    angle: '앵글',
    style: '스타일',
    action: '액션',
    setting: '장소',
    focus: '포커스',
    scene: '씬',
    location: '장소',
    time: '시간대',
    mood: '분위기',
    layout: '레이아웃',
    season: '계절',
    theme: '테마',
    atmosphere: '분위기',
    productPlacement: '제품 배치',
  }

  // 옵션 값 라벨
  const optionValueLabels: Record<string, Record<string, string>> = {
    pose: {
      natural_hold: '자연스럽게 들기',
      showing_camera: '카메라에 보여주기',
      near_face: '얼굴 근처',
      both_hands: '양손으로 들기',
      casual_hold: '캐주얼하게 들기',
      standing: '서 있는 포즈',
      walking: '걷는 포즈',
      sitting: '앉은 포즈',
      dynamic: '다이나믹 포즈',
    },
    gaze: {
      camera: '카메라 응시',
      product: '제품 응시',
      away: '다른 곳 응시',
      down: '아래 응시',
      up: '위 응시',
    },
    background: {
      studio: '스튜디오',
      studio_white: '화이트 스튜디오',
      studio_gradient: '그라데이션 스튜디오',
      outdoor: '야외',
      home: '집',
      office: '오피스',
      cafe: '카페',
      nature: '자연',
      marble: '대리석',
      wood: '나무',
      fabric: '패브릭',
      minimal: '미니멀',
      white: '화이트',
      gradient: '그라데이션',
      neutral: '중성색',
    },
    expression: {
      smile: '미소',
      natural: '자연스러움',
      confident: '자신감',
      friendly: '친근함',
    },
    framing: {
      closeup: '클로즈업',
      medium: '미디엄샷',
      full_body: '전신샷',
      three_quarter: '3/4 샷',
      upper_body: '상반신',
    },
    lighting: {
      soft: '소프트',
      natural: '자연광',
      dramatic: '드라마틱',
      warm: '따뜻한 조명',
      cool: '차가운 조명',
      consistent: '일관된 조명',
    },
    angle: {
      front: '정면',
      three_quarter: '3/4 앵글',
      side: '측면',
      top_down: '탑다운',
      low_angle: '로우 앵글',
    },
    style: {
      minimalist: '미니멀리스트',
      luxury: '럭셔리',
      lifestyle: '라이프스타일',
      editorial: '에디토리얼',
      commercial: '커머셜',
      streetwear: '스트릿웨어',
      elegant: '엘레강스',
      influencer: '인플루언서',
      professional: '프로페셔널',
      casual: '캐주얼',
      clean: '클린',
      detailed: '디테일',
      infographic: '인포그래픽',
    },
    action: {
      applying: '바르는 중',
      demonstrating: '시연',
      enjoying: '즐기는 중',
      testing: '테스트',
      opening: '오픈',
      revealing: '공개',
      presenting: '프레젠팅',
      excited: '설레는',
    },
    setting: {
      bathroom: '욕실',
      vanity: '화장대',
      bedroom: '침실',
      desk: '책상',
      bed: '침대',
      couch: '소파',
      table: '테이블',
      street: '거리',
      indoor: '실내',
    },
    focus: {
      product_focus: '제품 중심',
      model_focus: '모델 중심',
      balanced: '균형',
      skin: '피부',
      hair: '헤어',
      overall: '전체',
    },
    scene: {
      morning_routine: '모닝 루틴',
      relaxing: '휴식',
      working: '업무',
      socializing: '소셜',
      exercising: '운동',
    },
    location: {
      living_room: '거실',
      kitchen: '주방',
      bedroom: '침실',
      outdoor_terrace: '야외 테라스',
      coffee_shop: '커피숍',
    },
    time: {
      morning: '아침',
      afternoon: '오후',
      evening: '저녁',
      golden_hour: '골든아워',
    },
    mood: {
      luxury: '럭셔리',
      casual: '캐주얼',
      professional: '프로페셔널',
      friendly: '친근',
      energetic: '활기찬',
      cozy: '아늑한',
      vibrant: '생동감',
      peaceful: '평화로운',
      sophisticated: '세련된',
      warm: '따뜻한',
      fresh: '상쾌한',
    },
    layout: {
      side_by_side: '좌우 배치',
      split_screen: '분할 화면',
      stacked: '상하 배치',
    },
    season: {
      spring: '봄',
      summer: '여름',
      fall: '가을',
      winter: '겨울',
    },
    theme: {
      holiday: '홀리데이',
      valentines: '발렌타인',
      new_year: '새해',
      festive: '축제',
      none: '없음',
    },
    atmosphere: {
      warm: '따뜻한',
      fresh: '상쾌한',
      cozy: '아늑한',
      bright: '밝은',
    },
    productPlacement: {
      none: '제품 없음',
      holding: '손에 들고',
      bag: '가방에',
      accessory: '액세서리로',
      nearby: '근처에 배치',
    },
  }

  const getOptionLabel = (key: string, value: unknown): string | null => {
    // 객체인 경우 건너뛰기 (ai_avatar_options 같은 nested 객체)
    if (typeof value === 'object' && value !== null) return null
    // 문자열이 아닌 경우 문자열로 변환
    const strValue = String(value)
    // 커스텀 옵션인 경우 그대로 표시
    if (strValue === '__custom__') return '커스텀'
    return optionValueLabels[key]?.[strValue] || strValue
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (!imageAd) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/image-ad')}
            className="p-2 hover:bg-secondary/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {t.imageAdDetail?.title || '이미지 광고 상세'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {getAdTypeTitle(imageAd.ad_type)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* 전체 다운로드 (배치인 경우만) */}
          {hasMultipleImages && (
            <button
              onClick={handleDownloadAll}
              disabled={isDownloadingAll}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
            >
              {isDownloadingAll ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              전체 다운로드 ({imageUrls.length})
            </button>
          )}
          {/* 쇼케이스 등록 (어드민 전용) */}
          {isAdmin && imageAd.status === 'COMPLETED' && (
            <button
              onClick={handleRegisterShowcase}
              disabled={isRegisteringShowcase}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors disabled:opacity-50"
            >
              {isRegisteringShowcase ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Star className="w-4 h-4" />
              )}
              쇼케이스 등록
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            {t.adProduct?.delete || '삭제'}
          </button>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 생성된 이미지 */}
        <div className="space-y-4">
          {/* 메인 이미지 */}
          <div className="bg-card border border-border rounded-xl overflow-hidden group">
            <div className="aspect-square relative bg-[#1a1a2e]">
              {selectedImageUrl ? (
                <>
                  <img
                    src={selectedImageUrl}
                    alt={`Generated ad ${selectedImageIndex + 1}`}
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                  {/* 이미지 액션 버튼 오버레이 */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors">
                    <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={selectedOriginalUrl || selectedImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-white/90 hover:bg-white text-gray-700 rounded-lg transition-colors shadow-lg"
                        title="원본 보기"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDownload()}
                        className="p-2 bg-white/90 hover:bg-white text-gray-700 rounded-lg transition-colors shadow-lg"
                        title="다운로드"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditModalOpen(true)}
                        className="p-2 bg-primary/90 hover:bg-primary text-white rounded-lg transition-colors shadow-lg"
                        title="편집"
                      >
                        <Wand2 className="w-4 h-4" />
                      </button>
                      {imageUrls.length > 1 && (
                        <button
                          onClick={() => handleDeleteSingleImage(selectedImageIndex)}
                          disabled={isDeletingSingle}
                          className="p-2 bg-red-500/90 hover:bg-red-500 text-white rounded-lg transition-colors shadow-lg disabled:opacity-50"
                          title="이미지 삭제"
                        >
                          {isDeletingSingle ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          {/* 썸네일 그리드 (배치인 경우) */}
          {hasMultipleImages && (
            <div className={`grid ${getThumbnailGridClass(imageUrls.length)} gap-2`}>
              {imageUrls.map((url, idx) => (
                <div
                  key={idx}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all group/thumb ${
                    idx === selectedImageIndex
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-transparent hover:border-primary/50'
                  }`}
                >
                  <button
                    onClick={() => setSelectedImageIndex(idx)}
                    className="w-full h-full bg-[#1a1a2e]"
                  >
                    <img
                      src={url}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </button>
                  {/* 썸네일 호버 액션 */}
                  <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/40 transition-colors pointer-events-none">
                    <div className="absolute bottom-1 right-1 flex items-center gap-1 opacity-0 group-hover/thumb:opacity-100 transition-opacity pointer-events-auto">
                      <a
                        href={originalUrls[idx] || url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 bg-white/90 hover:bg-white text-gray-700 rounded transition-colors"
                        title="원본 보기"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownload(idx)
                        }}
                        className="p-1 bg-white/90 hover:bg-white text-gray-700 rounded transition-colors"
                        title="다운로드"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedImageIndex(idx)
                          setEditModalOpen(true)
                        }}
                        className="p-1 bg-primary/90 hover:bg-primary text-white rounded transition-colors"
                        title="편집"
                      >
                        <Wand2 className="w-3 h-3" />
                      </button>
                      {imageUrls.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteSingleImage(idx)
                          }}
                          disabled={isDeletingSingle}
                          className="p-1 bg-red-500/90 hover:bg-red-500 text-white rounded transition-colors disabled:opacity-50"
                          title="이미지 삭제"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 이미지 정보 (배치인 경우) */}
          {hasMultipleImages && (
            <p className="text-center text-sm text-muted-foreground">
              {selectedImageIndex + 1} / {imageUrls.length}
            </p>
          )}
        </div>

        {/* 상세 정보 */}
        <div className="space-y-4">
          {/* 관련 제품 */}
          {imageAd.ad_products && (
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-primary" />
                <h3 className="font-medium text-foreground">
                  {t.imageAdDetail?.product || '광고 제품'}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg bg-secondary/30 overflow-hidden flex-shrink-0">
                  {(imageAd.ad_products.rembg_image_url || imageAd.ad_products.image_url) ? (
                    <img
                      src={imageAd.ad_products.rembg_image_url || imageAd.ad_products.image_url || ''}
                      alt={imageAd.ad_products.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">{imageAd.ad_products.name}</p>
                  <button
                    onClick={() => router.push(`/dashboard/image-ad/product/${imageAd.product_id}`)}
                    className="text-sm text-primary hover:underline"
                  >
                    {t.imageAdDetail?.viewProduct || '제품 상세보기'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 관련 아바타 */}
          {imageAd.avatars && (
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-primary" />
                <h3 className="font-medium text-foreground">
                  {t.imageAdDetail?.avatar || '아바타'}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-secondary/30 overflow-hidden flex-shrink-0">
                  {imageAd.avatars.image_url ? (
                    <img
                      src={imageAd.avatars.image_url}
                      alt={imageAd.avatars.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">{imageAd.avatars.name}</p>
                  <button
                    onClick={() => router.push(`/dashboard/avatar/${imageAd.avatar_id}`)}
                    className="text-sm text-primary hover:underline"
                  >
                    {t.imageAdDetail?.viewAvatar || '아바타 상세보기'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 관련 의상 (착용샷인 경우) */}
          {imageAd.avatar_outfits && (
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shirt className="w-4 h-4 text-primary" />
                <h3 className="font-medium text-foreground">
                  {t.imageAdDetail?.outfit || '의상'}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg bg-secondary/30 overflow-hidden flex-shrink-0">
                  {imageAd.avatar_outfits.image_url ? (
                    <img
                      src={imageAd.avatar_outfits.image_url}
                      alt={imageAd.avatar_outfits.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Shirt className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <p className="font-medium text-foreground">{imageAd.avatar_outfits.name}</p>
              </div>
            </div>
          )}

          {/* 생성 옵션 */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Settings2 className="w-4 h-4 text-primary" />
              <h3 className="font-medium text-foreground">
                {t.imageAdDetail?.options || '생성 옵션'}
              </h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t.imageAdDetail?.adType || '광고 유형'}
                </span>
                <span className="text-foreground">{getAdTypeTitle(imageAd.ad_type)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t.imageAdDetail?.aspectRatio || '이미지 비율'}
                </span>
                <span className="text-foreground">{getAspectRatioLabel(imageAd.image_size)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t.imageAdDetail?.quality || '퀄리티'}
                </span>
                <span className="text-foreground">{getQualityLabel(imageAd.quality)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t.imageAdDetail?.createdAt || '생성일'}
                </span>
                <span className="text-foreground">
                  {new Date(imageAd.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* 상세 설정 */}
          {imageAd.selected_options && Object.keys(imageAd.selected_options).length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Settings2 className="w-4 h-4 text-primary" />
                <h3 className="font-medium text-foreground">
                  {t.imageAdDetail?.detailSettings || '상세 설정'}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(imageAd.selected_options).map(([key, value]) => {
                  if (!value || value === 'none') return null
                  const label = getOptionLabel(key, value)
                  // 객체 값인 경우 (null 반환) 건너뛰기
                  if (label === null) return null
                  return (
                    <div
                      key={key}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-secondary/50 rounded-lg text-sm"
                    >
                      <span className="text-muted-foreground">
                        {optionGroupLabels[key] || key}:
                      </span>
                      <span className="text-foreground font-medium">
                        {label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 이미지 편집 모달 */}
      {selectedImageUrl && (
        <ImageEditModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          imageAdId={imageAdId}
          imageUrl={selectedImageUrl}
          imageIndex={selectedImageIndex}
          quality={(imageAd.quality as 'medium' | 'high') || 'medium'}
          onEditComplete={(newImageIndex) => {
            // 편집 완료 후 데이터 새로고침 및 새 이미지 선택
            fetchImageAd().then(() => {
              setSelectedImageIndex(newImageIndex)
            })
          }}
        />
      )}
    </div>
  )
}
