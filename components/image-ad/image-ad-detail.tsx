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
    if (!confirm(t.imageAdDetail?.confirmDelete || 'Are you sure you want to delete this image ad?')) return

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

    if (!confirm(t.imageAdDetail?.confirmShowcase || 'Register this image ad as a showcase?')) return

    setIsRegisteringShowcase(true)
    try {
      const res = await fetch('/api/admin/showcases/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'image',
          adId: imageAd.id,
          title: imageAd.ad_products?.name || 'Image Ad',
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
        alert(t.imageAdDetail?.showcaseRegistered || 'Registered as showcase.')
      } else {
        const data = await res.json()
        alert(data.error || t.imageAdDetail?.registrationFailed || 'Registration failed.')
      }
    } catch (error) {
      console.error('Showcase registration error:', error)
      alert(t.imageAdDetail?.registrationError || 'Error during registration.')
    } finally {
      setIsRegisteringShowcase(false)
    }
  }

  const handleDeleteSingleImage = async (index: number) => {
    // 마지막 하나 남은 이미지는 삭제 불가
    if (imageUrls.length <= 1) {
      alert(t.imageAdDetail?.cannotDeleteLastImage || 'Cannot delete the last image.')
      return
    }

    if (!confirm(t.imageAdDetail?.confirmDeleteSingleImage || 'Are you sure you want to delete this image?')) return

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
        alert(data.error || t.imageAdDetail?.deleteFailed || 'Failed to delete image.')
      }
    } catch (error) {
      console.error('Image deletion error:', error)
      alert(t.imageAdDetail?.deleteFailed || 'Failed to delete image.')
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

    // Fallback labels (lowercase keys)
    const fallbackLabels: Record<string, string> = {
      pose: 'Pose',
      gaze: 'Gaze',
      background: 'Background',
      expression: 'Expression',
      framing: 'Framing',
      lighting: 'Lighting',
      angle: 'Angle',
      style: 'Style',
      action: 'Action',
      setting: 'Setting',
      focus: 'Focus',
      scene: 'Scene',
      location: 'Location',
      time: 'Time',
      mood: 'Mood',
      layout: 'Layout',
      season: 'Season',
      theme: 'Theme',
      atmosphere: 'Atmosphere',
      productplacement: 'Product Placement',
      // Additional keys
      color: 'Color',
      effect: 'Effect',
      composition: 'Composition',
      props: 'Props',
      weather: 'Weather',
      emotion: 'Emotion',
      intensity: 'Intensity',
      direction: 'Direction',
      model_type: 'Model Type',
      product_size: 'Product Size',
      camera_distance: 'Camera Distance',
      custom_prompt: 'Custom Prompt',
      // AI generation option keys
      outfit: 'Outfit',
      colortone: 'Color Tone',
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

    // Fallback labels (lowercase keys)
    const fallbackLabels: Record<string, Record<string, string>> = {
      pose: {
        natural_hold: 'Natural Hold',
        showing_camera: 'Showing to Camera',
        near_face: 'Near Face',
        both_hands: 'Both Hands',
        casual_hold: 'Casual Hold',
        standing: 'Standing',
        walking: 'Walking',
        sitting: 'Sitting',
        dynamic: 'Dynamic',
        leaning: 'Leaning',
        crossed_arms: 'Crossed Arms',
        hands_on_hips: 'Hands on Hips',
        relaxed: 'Relaxed',
        natural_elegant: 'Natural Elegant',
        showing_proudly: 'Showing Proudly',
        near_face_beauty: 'Near Face Beauty',
        both_hands_precious: 'Both Hands Precious',
        casual_relaxed: 'Casual Relaxed',
        dramatic_showcase: 'Dramatic Showcase',
        unboxing_reveal: 'Unboxing Reveal',
        standing_elegant: 'Standing Elegant',
        walking_motion: 'Walking Motion',
        sitting_relaxed: 'Sitting Relaxed',
        dynamic_action: 'Dynamic Action',
        leaning_casual: 'Leaning Casual',
        power_pose: 'Power Pose',
        candid_moment: 'Candid Moment',
      },
      gaze: {
        camera: 'Looking at Camera',
        product: 'Looking at Product',
        away: 'Looking Away',
        down: 'Looking Down',
        up: 'Looking Up',
        side: 'Side Glance',
        distant: 'Distant Look',
        camera_direct: 'Direct Camera',
        camera_soft: 'Soft Camera',
        product_focus: 'Product Focus',
        away_candid: 'Candid Away',
        down_thoughtful: 'Thoughtful Down',
        up_dreamy: 'Dreamy Up',
      },
      background: {
        studio: 'Studio',
        studio_white: 'White Studio',
        studio_gradient: 'Gradient Studio',
        outdoor: 'Outdoor',
        home: 'Home',
        office: 'Office',
        cafe: 'Cafe',
        nature: 'Nature',
        marble: 'Marble',
        wood: 'Wood',
        fabric: 'Fabric',
        minimal: 'Minimal',
        white: 'White',
        gradient: 'Gradient',
        neutral: 'Neutral',
        urban: 'Urban',
        beach: 'Beach',
        park: 'Park',
        restaurant: 'Restaurant',
        gym: 'Gym',
        custom: 'Custom',
        luxury_interior: 'Luxury Interior',
        modern_minimal: 'Modern Minimal',
        nature_blur: 'Nature Blur',
        urban_city: 'Urban City',
        abstract_art: 'Abstract Art',
        bokeh_lights: 'Bokeh Lights',
        marble_luxury: 'Luxury Marble',
        wood_natural: 'Natural Wood',
        fabric_texture: 'Fabric Texture',
        abstract_shapes: 'Abstract Shapes',
        floating_3d: 'Floating 3D',
        lifestyle_scene: 'Lifestyle Scene',
        studio_clean: 'Clean Studio',
        urban_street: 'Urban Street',
        nature_scenic: 'Nature Scenic',
        rooftop_city: 'Rooftop City',
        cafe_lifestyle: 'Cafe Lifestyle',
        beach_resort: 'Beach Resort',
        seasonal_props: 'Seasonal Props',
        nature_setting: 'Nature Setting',
        studio_themed: 'Themed Studio',
        abstract_festive: 'Abstract Festive',
      },
      expression: {
        smile: 'Smile',
        natural: 'Natural',
        confident: 'Confident',
        friendly: 'Friendly',
        serious: 'Serious',
        happy: 'Happy',
        neutral: 'Neutral',
        playful: 'Playful',
        elegant: 'Elegant',
        warm_smile: 'Warm Smile',
        natural_glow: 'Natural Glow',
        confident_bold: 'Confident Bold',
        friendly_approachable: 'Friendly Approachable',
        mysterious_allure: 'Mysterious Allure',
        excited_joyful: 'Excited Joyful',
      },
      framing: {
        closeup: 'Close-up',
        medium: 'Medium Shot',
        full_body: 'Full Body',
        three_quarter: '3/4 Shot',
        upper_body: 'Upper Body',
        face_closeup: 'Face Close-up',
        waist_up: 'Waist Up',
        knee_up: 'Knee Up',
        extreme_closeup: 'Extreme Close-up',
        closeup_portrait: 'Close-up Portrait',
        medium_waist: 'Medium Waist',
        three_quarter_body: '3/4 Body',
        full_body_wide: 'Full Body Wide',
        detail_focus: 'Detail Focus',
      },
      lighting: {
        soft: 'Soft',
        natural: 'Natural Light',
        dramatic: 'Dramatic',
        warm: 'Warm Light',
        cool: 'Cool Light',
        consistent: 'Consistent',
        studio: 'Studio Light',
        rim: 'Rim Light',
        backlit: 'Backlit',
        side: 'Side Light',
        soft_diffused: 'Soft Diffused',
        natural_window: 'Window Light',
        dramatic_contrast: 'Dramatic Contrast',
        golden_hour: 'Golden Hour',
        rim_light: 'Rim Light',
        neon_glow: 'Neon Glow',
        high_key: 'High Key',
        low_key: 'Low Key',
        warm_golden: 'Warm Golden',
      },
      angle: {
        front: 'Front',
        three_quarter: '3/4 Angle',
        side: 'Side',
        top_down: 'Top Down',
        low_angle: 'Low Angle',
        high_angle: 'High Angle',
        eye_level: 'Eye Level',
        dutch: 'Dutch Angle',
        front_hero: 'Hero Front',
        side_profile: 'Side Profile',
        top_down_flat: 'Top Down Flat',
        low_angle_dramatic: 'Dramatic Low Angle',
        macro_detail: 'Macro Detail',
        dynamic_tilt: 'Dynamic Tilt',
      },
      style: {
        minimalist: 'Minimalist',
        luxury: 'Luxury',
        lifestyle: 'Lifestyle',
        editorial: 'Editorial',
        commercial: 'Commercial',
        streetwear: 'Streetwear',
        elegant: 'Elegant',
        influencer: 'Influencer',
        professional: 'Professional',
        casual: 'Casual',
        clean: 'Clean',
        detailed: 'Detailed',
        infographic: 'Infographic',
        vintage: 'Vintage',
        modern: 'Modern',
        artistic: 'Artistic',
        natural: 'Natural',
        minimalist_clean: 'Minimalist Clean',
        luxury_premium: 'Luxury Premium',
        lifestyle_context: 'Lifestyle Context',
        editorial_artistic: 'Editorial Artistic',
        tech_futuristic: 'Tech Futuristic',
        vintage_retro: 'Vintage Retro',
        editorial_high: 'High Editorial',
        commercial_clean: 'Clean Commercial',
        streetwear_urban: 'Urban Streetwear',
        elegant_luxury: 'Elegant Luxury',
        sporty_active: 'Sporty Active',
        bohemian_free: 'Bohemian Free',
        influencer_trendy: 'Trendy Influencer',
        professional_clean: 'Clean Professional',
        casual_authentic: 'Authentic Casual',
        asmr_satisfying: 'ASMR Satisfying',
      },
      action: {
        applying: 'Applying',
        demonstrating: 'Demonstrating',
        enjoying: 'Enjoying',
        testing: 'Testing',
        opening: 'Opening',
        revealing: 'Revealing',
        presenting: 'Presenting',
        excited: 'Excited',
        using: 'Using',
        holding: 'Holding',
        showing: 'Showing',
        comparing: 'Comparing',
        applying_skincare: 'Applying Skincare',
        demonstrating_how: 'Demonstrating How',
        enjoying_moment: 'Enjoying Moment',
        before_application: 'Before Application',
        mid_application: 'Mid Application',
        result_showcase: 'Result Showcase',
        routine_step: 'Routine Step',
        opening_anticipation: 'Opening with Anticipation',
        revealing_surprise: 'Surprise Reveal',
        presenting_proudly: 'Presenting Proudly',
        excited_reaction: 'Excited Reaction',
        examining_detail: 'Examining Detail',
        first_touch: 'First Touch',
        comparing_items: 'Comparing Items',
      },
      setting: {
        bathroom: 'Bathroom',
        vanity: 'Vanity',
        bedroom: 'Bedroom',
        desk: 'Desk',
        bed: 'Bed',
        couch: 'Couch',
        table: 'Table',
        street: 'Street',
        indoor: 'Indoor',
        outdoor: 'Outdoor',
        studio: 'Studio',
        kitchen: 'Kitchen',
        living_room: 'Living Room',
        luxury_bathroom: 'Luxury Bathroom',
        modern_vanity: 'Modern Vanity',
        cozy_bedroom: 'Cozy Bedroom',
        spa_retreat: 'Spa Retreat',
        natural_outdoor: 'Natural Outdoor',
        minimal_studio: 'Minimal Studio',
        modern_desk: 'Modern Desk',
        cozy_bed: 'Cozy Bed',
        stylish_couch: 'Stylish Couch',
        marble_table: 'Marble Table',
        floor_flatlay: 'Floor Flatlay',
        vanity_setup: 'Vanity Setup',
        urban_street: 'Urban Street',
        cafe: 'Cafe',
        office: 'Office',
        gym: 'Gym',
        park: 'Park',
        rooftop: 'Rooftop',
        beach: 'Beach',
        nature: 'Nature',
      },
      focus: {
        product_focus: 'Product Focus',
        model_focus: 'Model Focus',
        balanced: 'Balanced',
        skin: 'Skin',
        hair: 'Hair',
        overall: 'Overall',
        detail: 'Detail',
        texture: 'Texture',
        product_hero: 'Product Hero',
        model_emotion: 'Model Emotion',
        balanced_harmony: 'Balanced Harmony',
        detail_texture: 'Detail Texture',
        environment_context: 'Environment Context',
      },
      scene: {
        morning_routine: 'Morning Routine',
        relaxing: 'Relaxing',
        working: 'Working',
        socializing: 'Socializing',
        exercising: 'Exercising',
        shopping: 'Shopping',
        traveling: 'Traveling',
        dining: 'Dining',
        morning_ritual: 'Morning Ritual',
        relaxing_moment: 'Relaxing Moment',
        work_from_home: 'Work from Home',
        social_gathering: 'Social Gathering',
        fitness_wellness: 'Fitness Wellness',
        travel_adventure: 'Travel Adventure',
        self_care_spa: 'Self Care Spa',
        date_night: 'Date Night',
      },
      location: {
        living_room: 'Living Room',
        kitchen: 'Kitchen',
        bedroom: 'Bedroom',
        outdoor_terrace: 'Outdoor Terrace',
        coffee_shop: 'Coffee Shop',
        office: 'Office',
        gym: 'Gym',
        park: 'Park',
        beach: 'Beach',
        city: 'City',
        modern_living: 'Modern Living',
        designer_kitchen: 'Designer Kitchen',
        luxe_bedroom: 'Luxe Bedroom',
        rooftop_terrace: 'Rooftop Terrace',
        trendy_cafe: 'Trendy Cafe',
        beach_poolside: 'Beach Poolside',
        mountain_retreat: 'Mountain Retreat',
        urban_loft: 'Urban Loft',
        urban_street: 'Urban Street',
        street: 'Street',
        cafe: 'Cafe',
        studio: 'Studio',
        rooftop: 'Rooftop',
        nature: 'Nature',
        indoor: 'Indoor',
        outdoor: 'Outdoor',
      },
      time: {
        morning: 'Morning',
        afternoon: 'Afternoon',
        evening: 'Evening',
        golden_hour: 'Golden Hour',
        night: 'Night',
        dawn: 'Dawn',
        dusk: 'Dusk',
        sunrise_fresh: 'Fresh Sunrise',
        bright_midday: 'Bright Midday',
        blue_hour: 'Blue Hour',
        cozy_evening: 'Cozy Evening',
        night_ambiance: 'Night Ambiance',
      },
      mood: {
        luxury: 'Luxury',
        casual: 'Casual',
        professional: 'Professional',
        friendly: 'Friendly',
        energetic: 'Energetic',
        cozy: 'Cozy',
        vibrant: 'Vibrant',
        peaceful: 'Peaceful',
        sophisticated: 'Sophisticated',
        warm: 'Warm',
        fresh: 'Fresh',
        romantic: 'Romantic',
        playful: 'Playful',
        serene: 'Serene',
        luxury_premium: 'Luxury Premium',
        warm_friendly: 'Warm Friendly',
        modern_sleek: 'Modern Sleek',
        vibrant_energetic: 'Vibrant Energetic',
        calm_serene: 'Calm Serene',
        trendy_bold: 'Trendy Bold',
        elegant_timeless: 'Elegant Timeless',
        playful_fun: 'Playful Fun',
      },
      layout: {
        side_by_side: 'Side by Side',
        split_screen: 'Split Screen',
        stacked: 'Stacked',
        centered: 'Centered',
        diagonal: 'Diagonal',
        asymmetric: 'Asymmetric',
      },
      season: {
        spring: 'Spring',
        summer: 'Summer',
        fall: 'Fall',
        winter: 'Winter',
        autumn: 'Autumn',
        spring_bloom: 'Spring Bloom',
        summer_vibrant: 'Vibrant Summer',
        fall_warm: 'Warm Fall',
        winter_cozy: 'Cozy Winter',
      },
      theme: {
        holiday: 'Holiday',
        valentines: 'Valentines',
        new_year: 'New Year',
        festive: 'Festive',
        none: 'None',
        christmas: 'Christmas',
        halloween: 'Halloween',
        summer_vacation: 'Summer Vacation',
        holiday_festive: 'Holiday Festive',
        valentines_romantic: 'Valentines Romantic',
        new_year_celebration: 'New Year Celebration',
        halloween_spooky: 'Halloween Spooky',
        chuseok_traditional: 'Chuseok Traditional',
        christmas_magical: 'Christmas Magical',
      },
      atmosphere: {
        warm: 'Warm',
        fresh: 'Fresh',
        cozy: 'Cozy',
        bright: 'Bright',
        dark: 'Dark',
        dreamy: 'Dreamy',
        crisp: 'Crisp',
        magical_dreamy: 'Magical Dreamy',
        warm_cozy: 'Warm Cozy',
        fresh_energetic: 'Fresh Energetic',
        elegant_sophisticated: 'Elegant Sophisticated',
        playful_fun: 'Playful Fun',
        romantic_soft: 'Romantic Soft',
      },
      productPlacement: {
        none: 'No Product',
        holding: 'Holding',
        bag: 'In Bag',
        accessory: 'As Accessory',
        nearby: 'Nearby',
        prominent: 'Prominent',
        subtle: 'Subtle',
        in_use: 'In Use',
        holding_showcase: 'Holding Showcase',
        bag_styled: 'Styled Bag',
        accessory_complement: 'Accessory Complement',
        nearby_artful: 'Artful Nearby',
      },
      // Outfit options
      outfit: {
        keep_original: 'Keep Original',
        casual_everyday: 'Casual Everyday',
        formal_elegant: 'Formal Elegant',
        professional_business: 'Professional Business',
        sporty_athletic: 'Sporty Athletic',
        cozy_comfortable: 'Cozy Comfortable',
        trendy_fashion: 'Trendy Fashion',
        minimal_simple: 'Minimal Simple',
      },
      // Color tone options
      colortone: {
        bright_vivid: 'Bright Vivid',
        warm_golden: 'Warm Golden',
        cool_blue: 'Cool Blue',
        muted_pastel: 'Muted Pastel',
        high_contrast: 'High Contrast',
        cinematic: 'Cinematic',
        vintage_film: 'Vintage Film',
        monochrome: 'Monochrome',
      },
      // Composition options
      composition: {
        centered: 'Centered',
        rule_of_thirds: 'Rule of Thirds',
        asymmetric: 'Asymmetric',
        diagonal: 'Diagonal',
        framed: 'Framed',
        negative_space: 'Negative Space',
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
    if (strValue === '__custom__') return ((t as Record<string, unknown>).imageAdOptions as Record<string, string> | undefined)?.custom || 'Custom'
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
              {t.imageAdDetail?.title || 'Image Ad Detail'}
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
            {hasMultipleImages ? `${t.common?.download || 'Download'} (${imageUrls.length})` : (t.common?.download || 'Download')}
          </button>
          {/* 편집 버튼 */}
          <button
            onClick={() => setEditModalOpen(true)}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground hover:text-foreground transition-all duration-200"
            title={t.common?.edit || 'Edit'}
          >
            <Wand2 className="w-4 h-4" />
          </button>
          {/* Showcase registration (admin only) */}
          {isAdmin && imageAd.status === 'COMPLETED' && (
            <button
              onClick={handleRegisterShowcase}
              disabled={isRegisteringShowcase}
              className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-500 transition-all duration-200 disabled:opacity-50"
              title={t.imageAdDetail?.registerShowcase || 'Register Showcase'}
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
            title={t.common?.delete || 'Delete'}
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
                          title={t.imageAdDetail?.viewOriginal || 'View Original'}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleDownload()}
                          className="p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl transition-all duration-200"
                          title={t.common?.download || 'Download'}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditModalOpen(true)}
                          className="p-2.5 bg-primary/80 hover:bg-primary backdrop-blur-sm text-white rounded-xl transition-all duration-200"
                          title={t.common?.edit || 'Edit'}
                        >
                          <Wand2 className="w-4 h-4" />
                        </button>
                      </div>
                      {imageUrls.length > 1 && (
                        <button
                          onClick={() => handleDeleteSingleImage(selectedImageIndex)}
                          disabled={isDeletingSingle}
                          className="p-2.5 bg-red-500/80 hover:bg-red-500 backdrop-blur-sm text-white rounded-xl transition-all duration-200 disabled:opacity-50"
                          title={t.imageAdDetail?.deleteImage || 'Delete Image'}
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
                  {t.imageAdDetail?.product || 'Ad Product'}
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
                    {t.imageAdDetail?.viewProduct || 'View Product'} →
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
                  {t.imageAdDetail?.avatar || 'Avatar'}
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
                    {t.imageAdDetail?.viewAvatar || 'View Avatar'} →
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
                  {t.imageAdDetail?.outfit || 'Outfit'}
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
                {t.imageAdDetail?.options || 'Generation Options'}
              </h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
                <span className="text-muted-foreground">
                  {t.imageAdDetail?.adType || 'Ad Type'}
                </span>
                <span className="text-foreground font-medium">{getAdTypeTitle(imageAd.ad_type)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
                <span className="text-muted-foreground">
                  {t.imageAdDetail?.aspectRatio || 'Aspect Ratio'}
                </span>
                <span className="text-foreground font-medium">{getAspectRatioLabel(imageAd.image_size)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">
                  {t.imageAdDetail?.quality || 'Quality'}
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
                  {t.imageAdDetail?.detailSettings || 'Detailed Settings'}
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
