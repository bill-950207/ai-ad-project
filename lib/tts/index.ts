/**
 * TTS 모듈 진입점
 *
 * Kie.ai ElevenLabs v3 TTS 서비스를 export합니다.
 */

// Kie.ai ElevenLabs v3 TTS
export {
  // 타입
  type TTSLanguage,
  type VoiceInfo,
  type KieTTSInput,
  type KieTTSOutput,
  type KieTTSResult,
  type TTSQueueSubmitResponse,
  type TTSQueueStatusResponse,
  // 음성 목록
  KOREAN_VOICES,
  ENGLISH_VOICES,
  JAPANESE_VOICES,
  CHINESE_VOICES,
  VOICES_BY_LANGUAGE,
  LANGUAGE_LABELS,
  // 유틸리티
  getVoicesByLanguage,
  getAllVoices,
  findVoiceById,
  detectLanguage,
  estimateAudioDuration,
  getRecommendedCharCount,
  // 핵심 함수
  createTTSTask,
  waitForTTSResult,
  textToSpeech,
  downloadAudio,
  // 큐 인터페이스
  submitTTSToQueue,
  getTTSQueueStatus,
  getTTSQueueResponse,
} from '@/lib/kie/tts'
