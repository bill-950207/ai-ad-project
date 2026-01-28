/**
 * TTS 모듈 진입점
 *
 * 통합 TTS 서비스 및 개별 클라이언트를 export합니다.
 */

// 통합 서비스
export {
  UnifiedTTSService,
  getTTSService,
  generateSpeech,
  type TTSProvider,
  type TTSLanguage,
  type TTSRequest,
  type TTSResult,
  type TTSServiceConfig,
} from './unified-service'

// 개별 클라이언트 (필요시 직접 접근)
export { textToSpeech as minimaxTTS } from '@/lib/wavespeed/client'
export {
  textToSpeech as elevenLabsTTS,
  type EmotionPreset,
  EMOTION_PRESETS,
  addAudioTag,
  getRecommendedAudioTags,
  isV3Model,
  type AudioTag,
  AUDIO_TAG_DESCRIPTIONS,
} from '@/lib/elevenlabs/client'
