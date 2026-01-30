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

  // 옵션 그룹 라벨 - i18n 지원
  const getOptionGroupLabel = (key: string): string => {
    // 소문자로 정규화
    const normalizedKey = key.toLowerCase()

    // i18n에서 먼저 찾기
    const i18nLabels = (t as Record<string, unknown>).imageAdOptions as Record<string, Record<string, string>> | undefined
    if (i18nLabels?.groupLabels?.[key]) return i18nLabels.groupLabels[key]
    if (i18nLabels?.groupLabels?.[normalizedKey]) return i18nLabels.groupLabels[normalizedKey]

    // 폴백 라벨 (소문자 키로 통일)
    const fallbackLabels: Record<string, string> = {
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
      productplacement: '제품 배치',
      // 추가 키들
      color: '컬러',
      effect: '효과',
      composition: '구도',
      props: '소품',
      weather: '날씨',
      emotion: '감정',
      intensity: '강도',
      direction: '방향',
      model_type: '모델 타입',
      product_size: '제품 크기',
      camera_distance: '카메라 거리',
      custom_prompt: '커스텀 프롬프트',
      // AI 생성 옵션 키들
      outfit: '의상',
      colortone: '컬러톤',
    }
    return fallbackLabels[normalizedKey] || key
  }

  // 옵션 값 라벨 - i18n 지원
  const getOptionValueLabel = (key: string, value: string): string => {
    // 소문자로 정규화
    const normalizedKey = key.toLowerCase()

    // i18n에서 먼저 찾기
    const i18nLabels = (t as Record<string, unknown>).imageAdOptions as Record<string, Record<string, Record<string, string>>> | undefined
    if (i18nLabels?.valueLabels?.[key]?.[value]) return i18nLabels.valueLabels[key][value]
    if (i18nLabels?.valueLabels?.[normalizedKey]?.[value]) return i18nLabels.valueLabels[normalizedKey][value]

    // 폴백 라벨 (소문자 키로 통일)
    const fallbackLabels: Record<string, Record<string, string>> = {
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
        leaning: '기대는 포즈',
        crossed_arms: '팔짱 포즈',
        hands_on_hips: '손을 허리에',
        relaxed: '편안한 포즈',
        // 새 옵션들
        natural_elegant: '자연스럽고 우아한',
        showing_proudly: '자신있게 보여주기',
        near_face_beauty: '얼굴 근처 뷰티',
        both_hands_precious: '양손으로 소중히',
        casual_relaxed: '캐주얼하고 편안한',
        dramatic_showcase: '드라마틱 쇼케이스',
        unboxing_reveal: '언박싱 공개',
        standing_elegant: '우아하게 서기',
        walking_motion: '걷는 모션',
        sitting_relaxed: '편안하게 앉기',
        dynamic_action: '다이나믹 액션',
        leaning_casual: '캐주얼하게 기대기',
        power_pose: '파워 포즈',
        candid_moment: '캔디드 순간',
      },
      gaze: {
        camera: '카메라 응시',
        product: '제품 응시',
        away: '다른 곳 응시',
        down: '아래 응시',
        up: '위 응시',
        side: '측면 응시',
        distant: '먼 곳 응시',
        // 새 옵션들
        camera_direct: '카메라 직접 응시',
        camera_soft: '부드러운 카메라 응시',
        product_focus: '제품에 집중',
        away_candid: '자연스럽게 다른 곳',
        down_thoughtful: '생각하듯 아래로',
        up_dreamy: '꿈꾸듯 위로',
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
        urban: '도시',
        beach: '해변',
        park: '공원',
        restaurant: '레스토랑',
        gym: '헬스장',
        custom: '커스텀',
        // 새 옵션들
        luxury_interior: '럭셔리 인테리어',
        modern_minimal: '모던 미니멀',
        nature_blur: '자연 블러',
        urban_city: '도시 풍경',
        abstract_art: '추상 아트',
        bokeh_lights: '보케 라이트',
        marble_luxury: '럭셔리 대리석',
        wood_natural: '내추럴 우드',
        fabric_texture: '패브릭 텍스처',
        abstract_shapes: '추상 도형',
        floating_3d: '플로팅 3D',
        lifestyle_scene: '라이프스타일 씬',
        studio_clean: '클린 스튜디오',
        urban_street: '도시 거리',
        nature_scenic: '자연 경치',
        rooftop_city: '루프탑 시티',
        cafe_lifestyle: '카페 라이프스타일',
        beach_resort: '비치 리조트',
        seasonal_props: '시즌 소품',
        nature_setting: '자연 세팅',
        studio_themed: '테마 스튜디오',
        abstract_festive: '축제 추상',
      },
      expression: {
        smile: '미소',
        natural: '자연스러움',
        confident: '자신감',
        friendly: '친근함',
        serious: '진지함',
        happy: '행복',
        neutral: '무표정',
        playful: '장난스러움',
        elegant: '우아함',
        // 새 옵션들
        warm_smile: '따뜻한 미소',
        natural_glow: '내추럴 글로우',
        confident_bold: '볼드한 자신감',
        friendly_approachable: '친근하고 다가가기 쉬운',
        mysterious_allure: '미스터리어스 얼루어',
        excited_joyful: '설레는 기쁨',
      },
      framing: {
        closeup: '클로즈업',
        medium: '미디엄샷',
        full_body: '전신샷',
        three_quarter: '3/4 샷',
        upper_body: '상반신',
        face_closeup: '얼굴 클로즈업',
        waist_up: '허리 위',
        knee_up: '무릎 위',
        // 새 옵션들
        extreme_closeup: '익스트림 클로즈업',
        closeup_portrait: '클로즈업 포트레이트',
        medium_waist: '미디엄 웨이스트',
        three_quarter_body: '3/4 바디',
        full_body_wide: '풀바디 와이드',
        detail_focus: '디테일 포커스',
      },
      lighting: {
        soft: '소프트',
        natural: '자연광',
        dramatic: '드라마틱',
        warm: '따뜻한 조명',
        cool: '차가운 조명',
        consistent: '일관된 조명',
        studio: '스튜디오 조명',
        rim: '림 라이트',
        backlit: '역광',
        side: '측면 조명',
        // 새 옵션들
        soft_diffused: '소프트 디퓨즈드',
        natural_window: '창가 자연광',
        dramatic_contrast: '드라마틱 콘트라스트',
        golden_hour: '골든아워',
        rim_light: '림 라이트',
        neon_glow: '네온 글로우',
        high_key: '하이키',
        low_key: '로우키',
        warm_golden: '따뜻한 골든',
      },
      angle: {
        front: '정면',
        three_quarter: '3/4 앵글',
        side: '측면',
        top_down: '탑다운',
        low_angle: '로우 앵글',
        high_angle: '하이 앵글',
        eye_level: '눈높이',
        dutch: '더치 앵글',
        // 새 옵션들
        front_hero: '히어로 정면',
        side_profile: '사이드 프로필',
        top_down_flat: '탑다운 플랫',
        low_angle_dramatic: '드라마틱 로우 앵글',
        macro_detail: '매크로 디테일',
        dynamic_tilt: '다이나믹 틸트',
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
        vintage: '빈티지',
        modern: '모던',
        artistic: '아티스틱',
        natural: '내추럴',
        // 새 옵션들
        minimalist_clean: '미니멀 클린',
        luxury_premium: '럭셔리 프리미엄',
        lifestyle_context: '라이프스타일 컨텍스트',
        editorial_artistic: '에디토리얼 아티스틱',
        tech_futuristic: '테크 퓨처리스틱',
        vintage_retro: '빈티지 레트로',
        editorial_high: '하이 에디토리얼',
        commercial_clean: '클린 커머셜',
        streetwear_urban: '어반 스트릿웨어',
        elegant_luxury: '엘레강스 럭셔리',
        sporty_active: '스포티 액티브',
        bohemian_free: '보헤미안 프리',
        influencer_trendy: '트렌디 인플루언서',
        professional_clean: '클린 프로페셔널',
        casual_authentic: '오센틱 캐주얼',
        asmr_satisfying: 'ASMR 새티스파잉',
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
        using: '사용 중',
        holding: '들고 있는',
        showing: '보여주는',
        comparing: '비교하는',
        // 새 옵션들
        applying_skincare: '스킨케어 적용',
        demonstrating_how: '사용법 시연',
        enjoying_moment: '순간을 즐기는',
        before_application: '적용 전',
        mid_application: '적용 중',
        result_showcase: '결과 쇼케이스',
        routine_step: '루틴 단계',
        opening_anticipation: '기대감 있는 오픈',
        revealing_surprise: '서프라이즈 공개',
        presenting_proudly: '자랑스럽게 프레젠팅',
        excited_reaction: '설레는 리액션',
        examining_detail: '디테일 살피기',
        first_touch: '첫 터치',
        comparing_items: '아이템 비교',
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
        outdoor: '야외',
        studio: '스튜디오',
        kitchen: '주방',
        living_room: '거실',
        // 새 옵션들
        luxury_bathroom: '럭셔리 욕실',
        modern_vanity: '모던 화장대',
        cozy_bedroom: '아늑한 침실',
        spa_retreat: '스파 리트릿',
        natural_outdoor: '내추럴 야외',
        minimal_studio: '미니멀 스튜디오',
        modern_desk: '모던 데스크',
        cozy_bed: '아늑한 침대',
        stylish_couch: '스타일리시 소파',
        marble_table: '마블 테이블',
        floor_flatlay: '플로어 플랫레이',
        vanity_setup: '화장대 셋업',
        // 추가 장소 옵션
        urban_street: '도시 거리',
        cafe: '카페',
        office: '오피스',
        gym: '헬스장',
        park: '공원',
        rooftop: '루프탑',
        beach: '해변',
        nature: '자연',
      },
      focus: {
        product_focus: '제품 중심',
        model_focus: '모델 중심',
        balanced: '균형',
        skin: '피부',
        hair: '헤어',
        overall: '전체',
        detail: '디테일',
        texture: '텍스처',
        // 새 옵션들
        product_hero: '제품 히어로',
        model_emotion: '모델 감정',
        balanced_harmony: '균형 조화',
        detail_texture: '디테일 텍스처',
        environment_context: '환경 컨텍스트',
      },
      scene: {
        morning_routine: '모닝 루틴',
        relaxing: '휴식',
        working: '업무',
        socializing: '소셜',
        exercising: '운동',
        shopping: '쇼핑',
        traveling: '여행',
        dining: '식사',
        // 새 옵션들
        morning_ritual: '모닝 리추얼',
        relaxing_moment: '휴식의 순간',
        work_from_home: '재택근무',
        social_gathering: '소셜 모임',
        fitness_wellness: '피트니스 웰니스',
        travel_adventure: '여행 어드벤처',
        self_care_spa: '셀프케어 스파',
        date_night: '데이트 나이트',
      },
      location: {
        living_room: '거실',
        kitchen: '주방',
        bedroom: '침실',
        outdoor_terrace: '야외 테라스',
        coffee_shop: '커피숍',
        office: '오피스',
        gym: '헬스장',
        park: '공원',
        beach: '해변',
        city: '도시',
        // 새 옵션들
        modern_living: '모던 거실',
        designer_kitchen: '디자이너 주방',
        luxe_bedroom: '럭스 침실',
        rooftop_terrace: '루프탑 테라스',
        trendy_cafe: '트렌디 카페',
        beach_poolside: '비치 풀사이드',
        mountain_retreat: '마운틴 리트릿',
        urban_loft: '어반 로프트',
        // 추가 장소 옵션
        urban_street: '도시 거리',
        street: '거리',
        cafe: '카페',
        studio: '스튜디오',
        rooftop: '루프탑',
        nature: '자연',
        indoor: '실내',
        outdoor: '야외',
      },
      time: {
        morning: '아침',
        afternoon: '오후',
        evening: '저녁',
        golden_hour: '골든아워',
        night: '밤',
        dawn: '새벽',
        dusk: '황혼',
        // 새 옵션들
        sunrise_fresh: '상쾌한 일출',
        bright_midday: '밝은 정오',
        blue_hour: '블루아워',
        cozy_evening: '아늑한 저녁',
        night_ambiance: '밤 분위기',
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
        romantic: '로맨틱',
        playful: '장난스러운',
        serene: '고요한',
        // 새 옵션들
        luxury_premium: '럭셔리 프리미엄',
        warm_friendly: '따뜻하고 친근한',
        modern_sleek: '모던 슬릭',
        vibrant_energetic: '생동감 있는',
        calm_serene: '차분하고 고요한',
        trendy_bold: '트렌디 볼드',
        elegant_timeless: '우아한 타임리스',
        playful_fun: '즐거운',
      },
      layout: {
        side_by_side: '좌우 배치',
        split_screen: '분할 화면',
        stacked: '상하 배치',
        centered: '중앙 배치',
        diagonal: '대각선 배치',
        asymmetric: '비대칭 배치',
      },
      season: {
        spring: '봄',
        summer: '여름',
        fall: '가을',
        winter: '겨울',
        autumn: '가을',
        // 새 옵션들
        spring_bloom: '봄 블룸',
        summer_vibrant: '생동감 있는 여름',
        fall_warm: '따뜻한 가을',
        winter_cozy: '아늑한 겨울',
      },
      theme: {
        holiday: '홀리데이',
        valentines: '발렌타인',
        new_year: '새해',
        festive: '축제',
        none: '없음',
        christmas: '크리스마스',
        halloween: '할로윈',
        summer_vacation: '여름 휴가',
        // 새 옵션들
        holiday_festive: '홀리데이 페스티브',
        valentines_romantic: '발렌타인 로맨틱',
        new_year_celebration: '새해 셀러브레이션',
        halloween_spooky: '할로윈 스푸키',
        chuseok_traditional: '추석 전통',
        christmas_magical: '크리스마스 매지컬',
      },
      atmosphere: {
        warm: '따뜻한',
        fresh: '상쾌한',
        cozy: '아늑한',
        bright: '밝은',
        dark: '어두운',
        dreamy: '몽환적인',
        crisp: '선명한',
        // 새 옵션들
        magical_dreamy: '마법 같은 몽환',
        warm_cozy: '따뜻하고 아늑한',
        fresh_energetic: '상쾌하고 활기찬',
        elegant_sophisticated: '우아하고 세련된',
        playful_fun: '재미있는',
        romantic_soft: '로맨틱 소프트',
      },
      productPlacement: {
        none: '제품 없음',
        holding: '손에 들고',
        bag: '가방에',
        accessory: '액세서리로',
        nearby: '근처에 배치',
        prominent: '눈에 띄게',
        subtle: '자연스럽게',
        in_use: '사용 중',
        // 새 옵션들
        holding_showcase: '들고 쇼케이스',
        bag_styled: '스타일드 백',
        accessory_complement: '액세서리 코디',
        nearby_artful: '아트풀 근처 배치',
      },
      // 의상 옵션
      outfit: {
        keep_original: '원본 유지',
        casual_everyday: '캐주얼 일상',
        formal_elegant: '포멀 엘레강스',
        professional_business: '프로페셔널 비즈니스',
        sporty_athletic: '스포티 애슬레틱',
        cozy_comfortable: '코지 컴포터블',
        trendy_fashion: '트렌디 패션',
        minimal_simple: '미니멀 심플',
      },
      // 컬러톤 옵션 (소문자 키로 통일)
      colortone: {
        bright_vivid: '브라이트 비비드',
        warm_golden: '따뜻한 골든',
        cool_blue: '쿨 블루',
        muted_pastel: '뮤트 파스텔',
        high_contrast: '하이 콘트라스트',
        cinematic: '시네마틱',
        vintage_film: '빈티지 필름',
        monochrome: '모노크롬',
      },
      // 구도 옵션
      composition: {
        centered: '중앙 배치',
        rule_of_thirds: '삼분할 구도',
        asymmetric: '비대칭',
        diagonal: '대각선',
        framed: '프레임드',
        negative_space: '네거티브 스페이스',
      },
    }
    // 정규화된 키로 먼저 찾고, 없으면 원본 키로 찾기
    return fallbackLabels[normalizedKey]?.[value] || fallbackLabels[key]?.[value] || value
  }

  const getOptionLabel = (key: string, value: unknown): string | null => {
    // 객체인 경우 건너뛰기 (ai_avatar_options 같은 nested 객체)
    if (typeof value === 'object' && value !== null) return null
    // 문자열이 아닌 경우 문자열로 변환
    const strValue = String(value)
    // 커스텀 옵션인 경우 그대로 표시
    if (strValue === '__custom__') return ((t as Record<string, unknown>).imageAdOptions as Record<string, string> | undefined)?.custom || '커스텀'
    // 번역된 라벨 반환
    return getOptionValueLabel(key, strValue)
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
    <div className="space-y-8">
      {/* 헤더 - Refined Editorial Style */}
      <div className="flex items-center justify-between pb-6 border-b border-white/[0.06]">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/image-ad')}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 group"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {t.imageAdDetail?.title || '이미지 광고 상세'}
            </h1>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="px-2.5 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">
                {getAdTypeTitle(imageAd.ad_type)}
              </span>
              <span className="text-sm text-muted-foreground">
                {new Date(imageAd.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* 다운로드 버튼 - Primary */}
          <button
            onClick={() => hasMultipleImages ? handleDownloadAll() : handleDownload()}
            disabled={isDownloadingAll}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 disabled:opacity-50"
          >
            {isDownloadingAll ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {hasMultipleImages ? `다운로드 (${imageUrls.length})` : '다운로드'}
          </button>
          {/* 편집 버튼 */}
          <button
            onClick={() => setEditModalOpen(true)}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground hover:text-foreground transition-all duration-200"
            title="편집"
          >
            <Wand2 className="w-4 h-4" />
          </button>
          {/* 쇼케이스 등록 (어드민 전용) */}
          {isAdmin && imageAd.status === 'COMPLETED' && (
            <button
              onClick={handleRegisterShowcase}
              disabled={isRegisteringShowcase}
              className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-500 transition-all duration-200 disabled:opacity-50"
              title="쇼케이스 등록"
            >
              {isRegisteringShowcase ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Star className="w-4 h-4" />
              )}
            </button>
          )}
          {/* 삭제 버튼 */}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 text-muted-foreground hover:text-red-500 transition-all duration-200 disabled:opacity-50"
            title={t.adProduct?.delete || '삭제'}
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* 콘텐츠 - Flex 기반 갤러리 레이아웃 */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* 이미지 갤러리 섹션 */}
        <div className="flex-1 lg:max-w-[55%] space-y-4">
          {/* 메인 이미지 - Glassmorphism 스타일 */}
          <div className="relative group rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-900/50 to-zinc-950/80 ring-1 ring-white/5 shadow-2xl">
            {/* 배경 그라데이션 효과 */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent pointer-events-none" />

            <div className="relative aspect-[4/3] bg-[#0a0a12]">
              {selectedImageUrl ? (
                <>
                  <img
                    src={selectedImageUrl}
                    alt={`Generated ad ${selectedImageIndex + 1}`}
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                  {/* 호버 시 하단 그라데이션 오버레이 */}
                  <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <a
                          href={selectedOriginalUrl || selectedImageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl transition-all duration-200"
                          title="원본 보기"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleDownload()}
                          className="p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl transition-all duration-200"
                          title="다운로드"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditModalOpen(true)}
                          className="p-2.5 bg-primary/80 hover:bg-primary backdrop-blur-sm text-white rounded-xl transition-all duration-200"
                          title="편집"
                        >
                          <Wand2 className="w-4 h-4" />
                        </button>
                      </div>
                      {imageUrls.length > 1 && (
                        <button
                          onClick={() => handleDeleteSingleImage(selectedImageIndex)}
                          disabled={isDeletingSingle}
                          className="p-2.5 bg-red-500/80 hover:bg-red-500 backdrop-blur-sm text-white rounded-xl transition-all duration-200 disabled:opacity-50"
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
                  <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
                </div>
              )}
            </div>
          </div>

          {/* 썸네일 스트립 - Horizontal scroll */}
          {hasMultipleImages && (
            <div className="space-y-3">
              <div className="flex gap-3 overflow-x-auto py-2 px-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {imageUrls.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden ring-2 transition-all duration-200 group/thumb ${
                      idx === selectedImageIndex
                        ? 'ring-primary shadow-lg shadow-primary/25 scale-105'
                        : 'ring-transparent hover:ring-white/30 bg-[#0a0a12]'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-contain"
                    />
                    {/* 썸네일 호버 오버레이 */}
                    <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/40 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center gap-1">
                        <span
                          className="p-1 bg-white/90 hover:bg-white text-gray-700 rounded transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDownload(idx)
                          }}
                        >
                          <Download className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {/* 이미지 카운터 */}
              <p className="text-center text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{selectedImageIndex + 1}</span>
                <span className="mx-1">/</span>
                <span>{imageUrls.length}</span>
              </p>
            </div>
          )}
        </div>

        {/* 상세 정보 사이드바 - Glassmorphism */}
        <div className="lg:w-[420px] lg:sticky lg:top-6 lg:self-start space-y-4">
          {/* 관련 제품 */}
          {imageAd.ad_products && (
            <div className="relative backdrop-blur-xl rounded-2xl p-5 bg-white/[0.02] border border-white/[0.06] shadow-lg shadow-black/5 group/card hover:bg-white/[0.04] transition-colors duration-300">
              {/* 그라데이션 악센트 */}
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <Package className="w-4 h-4" />
                </div>
                <h3 className="font-medium text-foreground">
                  {t.imageAdDetail?.product || '광고 제품'}
                </h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-black/20 ring-1 ring-white/10 overflow-hidden flex-shrink-0">
                  {(imageAd.ad_products.rembg_image_url || imageAd.ad_products.image_url) ? (
                    <img
                      src={imageAd.ad_products.rembg_image_url || imageAd.ad_products.image_url || ''}
                      alt={imageAd.ad_products.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{imageAd.ad_products.name}</p>
                  <button
                    onClick={() => router.push(`/dashboard/image-ad/product/${imageAd.product_id}`)}
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    {t.imageAdDetail?.viewProduct || '제품 상세보기'} →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 관련 아바타 */}
          {imageAd.avatars && (
            <div className="relative backdrop-blur-xl rounded-2xl p-5 bg-white/[0.02] border border-white/[0.06] shadow-lg shadow-black/5 group/card hover:bg-white/[0.04] transition-colors duration-300">
              {/* 그라데이션 악센트 */}
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="font-medium text-foreground">
                  {t.imageAdDetail?.avatar || '아바타'}
                </h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-black/20 ring-1 ring-white/10 overflow-hidden flex-shrink-0">
                  {imageAd.avatars.image_url ? (
                    <img
                      src={imageAd.avatars.image_url}
                      alt={imageAd.avatars.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-6 h-6 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{imageAd.avatars.name}</p>
                  <button
                    onClick={() => router.push(`/dashboard/avatar/${imageAd.avatar_id}`)}
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    {t.imageAdDetail?.viewAvatar || '아바타 상세보기'} →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 관련 의상 (착용샷인 경우) */}
          {imageAd.avatar_outfits && (
            <div className="relative backdrop-blur-xl rounded-2xl p-5 bg-white/[0.02] border border-white/[0.06] shadow-lg shadow-black/5 group/card hover:bg-white/[0.04] transition-colors duration-300">
              {/* 그라데이션 악센트 */}
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <Shirt className="w-4 h-4" />
                </div>
                <h3 className="font-medium text-foreground">
                  {t.imageAdDetail?.outfit || '의상'}
                </h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-black/20 ring-1 ring-white/10 overflow-hidden flex-shrink-0">
                  {imageAd.avatar_outfits.image_url ? (
                    <img
                      src={imageAd.avatar_outfits.image_url}
                      alt={imageAd.avatar_outfits.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Shirt className="w-6 h-6 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <p className="font-medium text-foreground truncate">{imageAd.avatar_outfits.name}</p>
              </div>
            </div>
          )}

          {/* 생성 옵션 */}
          <div className="relative backdrop-blur-xl rounded-2xl p-5 bg-white/[0.02] border border-white/[0.06] shadow-lg shadow-black/5">
            {/* 그라데이션 악센트 */}
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Settings2 className="w-4 h-4" />
              </div>
              <h3 className="font-medium text-foreground">
                {t.imageAdDetail?.options || '생성 옵션'}
              </h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
                <span className="text-muted-foreground">
                  {t.imageAdDetail?.adType || '광고 유형'}
                </span>
                <span className="text-foreground font-medium">{getAdTypeTitle(imageAd.ad_type)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
                <span className="text-muted-foreground">
                  {t.imageAdDetail?.aspectRatio || '이미지 비율'}
                </span>
                <span className="text-foreground font-medium">{getAspectRatioLabel(imageAd.image_size)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">
                  {t.imageAdDetail?.quality || '퀄리티'}
                </span>
                <span className="text-foreground font-medium">{getQualityLabel(imageAd.quality)}</span>
              </div>
            </div>
          </div>

          {/* 상세 설정 */}
          {imageAd.selected_options && Object.keys(imageAd.selected_options).length > 0 && (
            <div className="relative backdrop-blur-xl rounded-2xl p-5 bg-white/[0.02] border border-white/[0.06] shadow-lg shadow-black/5">
              {/* 그라데이션 악센트 */}
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <Settings2 className="w-4 h-4" />
                </div>
                <h3 className="font-medium text-foreground">
                  {t.imageAdDetail?.detailSettings || '상세 설정'}
                </h3>
              </div>
              <div className="space-y-1.5">
                {Object.entries(imageAd.selected_options).map(([key, value]) => {
                  if (!value || value === 'none') return null
                  const label = getOptionLabel(key, value)
                  // 객체 값인 경우 (null 반환) 건너뛰기
                  if (label === null) return null
                  return (
                    <div
                      key={key}
                      className="py-1.5 border-b border-white/[0.04] last:border-b-0"
                    >
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">
                        {getOptionGroupLabel(key)}
                      </span>
                      <p className="mt-0.5 text-sm text-foreground">
                        {label}
                      </p>
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
