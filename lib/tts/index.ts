/**
 * TTS 모듈 진입점
 *
 * Kie.ai ElevenLabs v3 TTS 서비스를 export합니다.
 * ElevenLabs 음성은 모든 언어를 지원하므로 언어별 구분 없이 단일 목록으로 관리합니다.
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
  VOICE_IDS,
  VOICES,
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
