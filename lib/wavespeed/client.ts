/**
 * WaveSpeed AI Minimax Speech 2.6 HD 클라이언트
 *
 * TTS (Text-to-Speech) 서비스를 위한 클라이언트 라이브러리
 * - 다국어 음성 지원 (한국어, 영어, 일본어, 중국어)
 * - 비동기 작업 제출 및 결과 폴링
 */

const WAVESPEED_API_KEY = process.env.WAVE_SPEED_AI_KEY || ''
const BASE_URL = 'https://api.wavespeed.ai/api/v3/minimax/speech-2.6-hd'

/**
 * 음성 언어 타입
 */
export type VoiceLanguage = 'ko' | 'en' | 'ja' | 'zh'

/**
 * 음성 정보 인터페이스
 */
export interface VoiceInfo {
  id: string
  name: string
  description: string
  gender: 'male' | 'female'
  style: string
  sampleText: string
}

/**
 * 한국어 음성 목록 (WaveSpeed Minimax 공식 Voice ID)
 */
export const KOREAN_VOICES: VoiceInfo[] = [
  // Female voices (10개) - 공식 문서 기준
  {
    id: 'Korean_SweetGirl',
    name: '달콤한 소녀',
    description: '부드럽고 감미로운 젊은 여성 목소리',
    gender: 'female',
    style: 'sweet',
    sampleText: '안녕하세요! 오늘도 좋은 하루 되세요.',
  },
  {
    id: 'Korean_PowerfulGirl',
    name: '파워풀 걸',
    description: '힘있고 당찬 성인 여성 목소리',
    gender: 'female',
    style: 'powerful',
    sampleText: '여러분, 이 제품 정말 대박이에요!',
  },
  {
    id: 'Korean_DecisiveQueen',
    name: '단호한 여왕',
    description: '달콤하면서도 단호한 젊은 여성 목소리',
    gender: 'female',
    style: 'decisive',
    sampleText: '안녕하세요, 저희 제품을 소개해 드리겠습니다.',
  },
  {
    id: 'Korean_EnchantingSister',
    name: '매력적인 언니',
    description: '매력적이고 친근한 성인 여성 목소리',
    gender: 'female',
    style: 'charming',
    sampleText: '어머, 이거 정말 좋은 제품이에요!',
  },
  {
    id: 'Korean_CalmLady',
    name: '차분한 숙녀',
    description: '차분하고 신뢰감 있는 성인 여성 목소리',
    gender: 'female',
    style: 'calm',
    sampleText: '차근차근 설명해 드릴게요.',
  },
  {
    id: 'Korean_WiseElf',
    name: '현명한 요정',
    description: '신비롭고 지적인 여성 목소리',
    gender: 'female',
    style: 'wise',
    sampleText: '특별한 제품을 소개해 드릴게요.',
  },
  {
    id: 'Korean_CheerfulLittleSister',
    name: '밝은 여동생',
    description: '밝고 활기찬 젊은 여성 목소리',
    gender: 'female',
    style: 'cheerful',
    sampleText: '안녕하세요! 정말 좋은 소식이 있어요!',
  },
  {
    id: 'Korean_SoothingLady',
    name: '편안한 숙녀',
    description: '온화하고 부드러운 성인 여성 목소리',
    gender: 'female',
    style: 'soothing',
    sampleText: '오늘 소개해 드릴 제품이에요.',
  },
  {
    id: 'Korean_ElegantPrincess',
    name: '우아한 공주',
    description: '우아하고 세련된 젊은 여성 목소리',
    gender: 'female',
    style: 'elegant',
    sampleText: '이 제품은 정말 특별해요.',
  },
  {
    id: 'Korean_MatureLady',
    name: '성숙한 숙녀',
    description: '성숙하고 신뢰감 있는 성인 여성 목소리',
    gender: 'female',
    style: 'mature',
    sampleText: '안녕하세요! 좋은 거 알려드릴게요.',
  },
  // Male voices (10개) - 공식 문서 기준
  {
    id: 'Korean_ColdYoungMan',
    name: '차가운 청년',
    description: '차분하고 냉철한 성인 남성 목소리',
    gender: 'male',
    style: 'cold',
    sampleText: '안녕하십니까, 좋은 제품을 소개해 드리겠습니다.',
  },
  {
    id: 'Korean_StrictBoss',
    name: '엄격한 사장님',
    description: '권위있고 신뢰감 있는 남성 목소리',
    gender: 'male',
    style: 'strict',
    sampleText: '이 제품의 품질은 제가 보장합니다.',
  },
  {
    id: 'Korean_CheerfulBoyfriend',
    name: '쾌활한 남자친구',
    description: '밝고 친근한 젊은 남성 목소리',
    gender: 'male',
    style: 'cheerful',
    sampleText: '안녕하세요! 좋은 제품 소개해 드릴게요.',
  },
  {
    id: 'Korean_BraveYouth',
    name: '용감한 청년',
    description: '활기차고 긍정적인 젊은 남성 목소리',
    gender: 'male',
    style: 'brave',
    sampleText: '여러분 반갑습니다! 좋은 소식이 있어요!',
  },
  {
    id: 'Korean_ReliableYouth',
    name: '믿음직한 청년',
    description: '신뢰감 있고 안정적인 청년 남성 목소리',
    gender: 'male',
    style: 'reliable',
    sampleText: '안녕! 이거 진짜 좋은 거야.',
  },
  {
    id: 'Korean_ConsiderateSenior',
    name: '다정한 선배',
    description: '친근하고 다정한 성인 남성 목소리',
    gender: 'male',
    style: 'considerate',
    sampleText: '오늘 소개해 드릴 제품입니다.',
  },
  {
    id: 'Korean_GentleBoss',
    name: '젠틀한 사장님',
    description: '따뜻하고 친근한 중년 남성 목소리',
    gender: 'male',
    style: 'gentle',
    sampleText: '자, 여러분! 이거 꼭 보세요!',
  },
  {
    id: 'Korean_EnthusiasticTeen',
    name: '열정적인 청소년',
    description: '밝고 활기찬 진행자 스타일 남성 목소리',
    gender: 'male',
    style: 'enthusiastic',
    sampleText: '좋은 제품을 소개해 드리겠습니다.',
  },
  {
    id: 'Korean_CheerfulCoolJunior',
    name: '쿨한 후배',
    description: '편안하고 자연스러운 젊은 남성 목소리',
    gender: 'male',
    style: 'cool',
    sampleText: '안녕, 오늘 좋은 거 알려줄게.',
  },
  {
    id: 'Korean_IntellectualMan',
    name: '지적인 남성',
    description: '전문적이고 신뢰감 있는 남성 목소리',
    gender: 'male',
    style: 'intellectual',
    sampleText: '이 제품에 대해 자세히 설명드리겠습니다.',
  },
]

/**
 * 영어 음성 목록 (WaveSpeed Minimax 공식 Voice ID)
 */
export const ENGLISH_VOICES: VoiceInfo[] = [
  // Female voices (10개) - 공식 문서 기준
  {
    id: 'English_radiant_girl',
    name: 'Radiant Girl',
    description: 'Bright and cheerful young female voice',
    gender: 'female',
    style: 'radiant',
    sampleText: 'Hey there! Let me tell you about this amazing product.',
  },
  {
    id: 'English_CalmWoman',
    name: 'Calm Woman',
    description: 'A calm and soothing adult female voice',
    gender: 'female',
    style: 'calm',
    sampleText: 'Good day, I would like to share something special with you.',
  },
  {
    id: 'English_Upbeat_Woman',
    name: 'Upbeat Woman',
    description: 'Upbeat and energetic adult female voice',
    gender: 'female',
    style: 'upbeat',
    sampleText: 'Hi! I have something wonderful to share with you.',
  },
  {
    id: 'English_PlayfulGirl',
    name: 'Playful Girl',
    description: 'Playful and fun young female voice',
    gender: 'female',
    style: 'playful',
    sampleText: 'Hey! Check out this awesome product!',
  },
  {
    id: 'English_ConfidentWoman',
    name: 'Confident Woman',
    description: 'Confident and assertive adult female voice',
    gender: 'female',
    style: 'confident',
    sampleText: 'Let me show you why this product is amazing.',
  },
  {
    id: 'English_Graceful_Lady',
    name: 'Graceful Lady',
    description: 'Graceful and elegant adult female voice',
    gender: 'female',
    style: 'graceful',
    sampleText: 'Hello! I am so excited to share this with you.',
  },
  {
    id: 'English_SereneWoman',
    name: 'Serene Woman',
    description: 'Serene and relaxing adult female voice',
    gender: 'female',
    style: 'serene',
    sampleText: 'Let me walk you through this wonderful product.',
  },
  {
    id: 'English_AttractiveGirl',
    name: 'Attractive Girl',
    description: 'Attractive and engaging young female voice',
    gender: 'female',
    style: 'attractive',
    sampleText: 'You guys are going to love this!',
  },
  {
    id: 'English_WhimsicalGirl',
    name: 'Whimsical Girl',
    description: 'Whimsical and expressive young female voice',
    gender: 'female',
    style: 'whimsical',
    sampleText: 'This is so good, you have to try it!',
  },
  {
    id: 'English_FriendlyNeighbor',
    name: 'Friendly Neighbor',
    description: 'Friendly and approachable female voice',
    gender: 'female',
    style: 'friendly',
    sampleText: 'So, let me tell you about this product.',
  },
  // Male voices (10개) - 공식 문서 기준
  {
    id: 'English_expressive_narrator',
    name: 'Expressive Narrator',
    description: 'An expressive adult male voice with British accent',
    gender: 'male',
    style: 'expressive',
    sampleText: 'Hello, let me introduce this amazing product to you.',
  },
  {
    id: 'English_magnetic_voiced_man',
    name: 'Magnetic Man',
    description: 'A magnetic and persuasive adult male voice',
    gender: 'male',
    style: 'magnetic',
    sampleText: 'Trust me, this is exactly what you need.',
  },
  {
    id: 'English_Trustworth_Man',
    name: 'Trustworthy Man',
    description: 'A trustworthy and reliable adult male voice',
    gender: 'male',
    style: 'trustworthy',
    sampleText: 'I guarantee you will love this product.',
  },
  {
    id: 'English_PatientMan',
    name: 'Patient Man',
    description: 'A patient and calm adult male voice',
    gender: 'male',
    style: 'patient',
    sampleText: 'Let me explain this step by step.',
  },
  {
    id: 'English_Comedian',
    name: 'Comedian',
    description: 'A fun and humorous male voice',
    gender: 'male',
    style: 'funny',
    sampleText: 'Hi everyone! I have something exciting to show you!',
  },
  {
    id: 'English_DeterminedMan',
    name: 'Determined Man',
    description: 'A determined and confident adult male voice',
    gender: 'male',
    style: 'determined',
    sampleText: 'Hey, let me share something special with you.',
  },
  {
    id: 'English_FriendlyPerson',
    name: 'Friendly Person',
    description: 'Friendly and approachable adult male voice',
    gender: 'male',
    style: 'friendly',
    sampleText: 'Hi there! I want to show you something cool.',
  },
  {
    id: 'English_ThoughtfulMan',
    name: 'Thoughtful Man',
    description: 'Thoughtful and mature adult male voice',
    gender: 'male',
    style: 'thoughtful',
    sampleText: 'Let me tell you about this quality product.',
  },
  {
    id: 'English_DecentYoungMan',
    name: 'Decent Young Man',
    description: 'Decent and polite young adult male voice',
    gender: 'male',
    style: 'decent',
    sampleText: 'This product is going to change your life.',
  },
  {
    id: 'English_Debator',
    name: 'Debator',
    description: 'Persuasive and articulate adult male voice',
    gender: 'male',
    style: 'persuasive',
    sampleText: 'Check this out! This is amazing!',
  },
]

/**
 * 일본어 음성 목록 (WaveSpeed Minimax 공식 Voice ID)
 */
export const JAPANESE_VOICES: VoiceInfo[] = [
  // Female voices (7개) - 공식 문서 기준
  {
    id: 'Japanese_Whisper_Belle',
    name: '囁く美女',
    description: 'ASMRに最適な囁き声の大人の女性',
    gender: 'female',
    style: 'whisper',
    sampleText: 'こんにちは、素敵な商品をご紹介しますね。',
  },
  {
    id: 'Japanese_DecisivePrincess',
    name: '決断力のあるプリンセス',
    description: '毅然とした決断力のある大人の女性の声',
    gender: 'female',
    style: 'decisive',
    sampleText: 'この商品、絶対おすすめです。',
  },
  {
    id: 'Japanese_ColdQueen',
    name: '冷たい女王',
    description: 'クールで威厳のある大人の女性の声',
    gender: 'female',
    style: 'cold',
    sampleText: 'ご紹介いたします。',
  },
  {
    id: 'Japanese_DependableWoman',
    name: '頼りになる女性',
    description: '信頼感のある大人の女性の声',
    gender: 'female',
    style: 'dependable',
    sampleText: 'こちらの商品について説明いたします。',
  },
  {
    id: 'Japanese_KindLady',
    name: '優しいお姉さん',
    description: '優しく親切な女性の声',
    gender: 'female',
    style: 'kind',
    sampleText: 'こんにちは、素敵なものを紹介するね。',
  },
  {
    id: 'Japanese_CalmLady',
    name: '穏やかな女性',
    description: '落ち着いた優しい大人の女性の声',
    gender: 'female',
    style: 'calm',
    sampleText: 'はじめまして、よろしくお願いします。',
  },
  {
    id: 'Japanese_GracefulMaiden',
    name: '上品な女性',
    description: '上品で優雅な大人の女性の声',
    gender: 'female',
    style: 'graceful',
    sampleText: '本日は素晴らしい商品をご紹介いたします。',
  },
  // Male voices (9개) - 공식 문서 기준
  {
    id: 'Japanese_OptimisticYouth',
    name: '楽観的な青年',
    description: '明るく前向きな大人の男性の声',
    gender: 'male',
    style: 'optimistic',
    sampleText: 'みなさん、こんにちは。',
  },
  {
    id: 'Japanese_LoyalKnight',
    name: '忠実な騎士',
    description: '誠実で信頼できる大人の男性の声',
    gender: 'male',
    style: 'loyal',
    sampleText: 'こんにちは、素晴らしい商品をご紹介します。',
  },
  {
    id: 'Japanese_GentleButler',
    name: '優しい執事',
    description: '丁寧で上品な大人の男性の声',
    gender: 'male',
    style: 'gentle',
    sampleText: 'お客様、こちらの商品をご覧ください。',
  },
  {
    id: 'Japanese_IntellectualSenior',
    name: '知的な先輩',
    description: '知的で落ち着いた男性の声',
    gender: 'male',
    style: 'intellectual',
    sampleText: 'この商品について詳しくご説明します。',
  },
  {
    id: 'Japanese_DominantMan',
    name: '威厳のある男性',
    description: '威厳があり信頼感のある男性の声',
    gender: 'male',
    style: 'dominant',
    sampleText: 'この商品、かなりいいぜ。',
  },
  {
    id: 'Japanese_SeriousCommander',
    name: '真剣な指揮官',
    description: '真剣で頼りになる男性の声',
    gender: 'male',
    style: 'serious',
    sampleText: '皆さん、本日もよろしくお願いします。',
  },
  {
    id: 'Japanese_GenerousIzakayaOwner',
    name: '居酒屋の大将',
    description: '親しみやすく温かい男性の声',
    gender: 'male',
    style: 'generous',
    sampleText: 'やあ、いい商品があるんだよ。',
  },
  {
    id: 'Japanese_SportyStudent',
    name: 'スポーティな学生',
    description: '元気で活発な若い男性の声',
    gender: 'male',
    style: 'sporty',
    sampleText: 'これ、めっちゃいいよ。見てみて。',
  },
  {
    id: 'Japanese_InnocentBoy',
    name: '純真な少年',
    description: '純真で明るい若い男性の声',
    gender: 'male',
    style: 'innocent',
    sampleText: '今回ご紹介するのはこちらの商品です。',
  },
]

/**
 * 중국어 음성 목록 (WaveSpeed Minimax 공식 Voice ID)
 * 참고: 중국어 Voice ID는 "Chinese (Mandarin)_" 형식
 */
export const CHINESE_VOICES: VoiceInfo[] = [
  // Female voices (10개)
  {
    id: 'Chinese (Mandarin)_Sweet_Lady',
    name: '甜美女士',
    description: '温柔甜美的成年女性声音',
    gender: 'female',
    style: 'sweet',
    sampleText: '大家好！今天给大家介绍一款好产品。',
  },
  {
    id: 'Chinese (Mandarin)_Warm_Girl',
    name: '温暖女孩',
    description: '温柔温暖的年轻女性声音',
    gender: 'female',
    style: 'warm',
    sampleText: '你好呀，来看看这个好东西！',
  },
  {
    id: 'Chinese (Mandarin)_News_Anchor',
    name: '新闻主播',
    description: '专业播音腔的中年女性声音',
    gender: 'female',
    style: 'professional',
    sampleText: '各位观众朋友们，大家好。',
  },
  {
    id: 'Chinese (Mandarin)_Arrogant_Miss',
    name: '傲娇小姐',
    description: '傲娇可爱的年轻女性声音',
    gender: 'female',
    style: 'arrogant',
    sampleText: '哼，这个产品还不错啦！',
  },
  {
    id: 'Chinese (Mandarin)_Cheerful_Girl',
    name: '开朗女孩',
    description: '活泼开朗的年轻女性声音',
    gender: 'female',
    style: 'cheerful',
    sampleText: '哈喽！今天给大家带来超棒的产品！',
  },
  {
    id: 'Chinese (Mandarin)_Elegant_Woman',
    name: '优雅女士',
    description: '优雅知性的成年女性声音',
    gender: 'female',
    style: 'elegant',
    sampleText: '今天为大家介绍一款精品。',
  },
  {
    id: 'Chinese (Mandarin)_Lively_Girl',
    name: '活力少女',
    description: '活力四射的年轻女性声音',
    gender: 'female',
    style: 'lively',
    sampleText: '大家快来看啊！这个超级赞！',
  },
  {
    id: 'Chinese (Mandarin)_Mature_Lady',
    name: '成熟女性',
    description: '成熟稳重的成年女性声音',
    gender: 'female',
    style: 'mature',
    sampleText: '让我来为您详细介绍这款产品。',
  },
  {
    id: 'Chinese (Mandarin)_Soft_Sister',
    name: '温柔姐姐',
    description: '温柔亲切的姐姐声音',
    gender: 'female',
    style: 'soft',
    sampleText: '小朋友们，姐姐给你们推荐好东西哦。',
  },
  {
    id: 'Chinese (Mandarin)_Narrator_Female',
    name: '女性旁白',
    description: '专业的女性旁白声音',
    gender: 'female',
    style: 'narrator',
    sampleText: '接下来，为您介绍本期产品。',
  },
  // Male voices (10개)
  {
    id: 'Chinese (Mandarin)_Reliable_Executive',
    name: '可靠高管',
    description: '稳重可靠的中年男性声音',
    gender: 'male',
    style: 'reliable',
    sampleText: '您好，让我来为您介绍这款产品。',
  },
  {
    id: 'Chinese (Mandarin)_Gentleman',
    name: '绅士',
    description: '优雅有魅力的成年男性声音',
    gender: 'male',
    style: 'gentleman',
    sampleText: '很高兴为您服务。',
  },
  {
    id: 'Chinese (Mandarin)_Sincere_Adult',
    name: '真诚青年',
    description: '真诚热情的年轻男性声音',
    gender: 'male',
    style: 'sincere',
    sampleText: '大家好！我来给大家推荐一个好东西！',
  },
  {
    id: 'Chinese (Mandarin)_Energetic_Elder_Brother',
    name: '活力大哥',
    description: '充满活力的成年男性声音',
    gender: 'male',
    style: 'energetic',
    sampleText: '嘿！快来看看这个！',
  },
  {
    id: 'Chinese (Mandarin)_Warm_Man',
    name: '温暖大叔',
    description: '温暖亲切的中年男性声音',
    gender: 'male',
    style: 'warm',
    sampleText: '朋友们，今天给大家推荐好东西。',
  },
  {
    id: 'Chinese (Mandarin)_Young_Host',
    name: '年轻主持',
    description: '年轻活力的主持人风格声音',
    gender: 'male',
    style: 'host',
    sampleText: '观众朋友们大家好！欢迎收看！',
  },
  {
    id: 'Chinese (Mandarin)_Casual_Guy',
    name: '随性小哥',
    description: '轻松随意的年轻男性声音',
    gender: 'male',
    style: 'casual',
    sampleText: '哥们儿，这东西真不错，来看看。',
  },
  {
    id: 'Chinese (Mandarin)_Professional_Man',
    name: '专业人士',
    description: '专业可信的成年男性声音',
    gender: 'male',
    style: 'professional',
    sampleText: '下面为您详细介绍产品特点。',
  },
  {
    id: 'Chinese (Mandarin)_Narrator_Male',
    name: '男性旁白',
    description: '专业的男性旁白声音',
    gender: 'male',
    style: 'narrator',
    sampleText: '本期节目为您带来精选产品。',
  },
  {
    id: 'Chinese (Mandarin)_Cool_Guy',
    name: '酷帅青年',
    description: '酷帅的年轻男性声音',
    gender: 'male',
    style: 'cool',
    sampleText: '兄弟们，这个产品绝了。',
  },
]

/**
 * 언어별 음성 목록 가져오기
 */
export function getVoicesByLanguage(language: VoiceLanguage): VoiceInfo[] {
  switch (language) {
    case 'ko':
      return KOREAN_VOICES
    case 'en':
      return ENGLISH_VOICES
    case 'ja':
      return JAPANESE_VOICES
    case 'zh':
      return CHINESE_VOICES
    default:
      return KOREAN_VOICES
  }
}

/**
 * 모든 언어의 음성 목록 가져오기
 */
export function getAllVoices(): Record<VoiceLanguage, VoiceInfo[]> {
  return {
    ko: KOREAN_VOICES,
    en: ENGLISH_VOICES,
    ja: JAPANESE_VOICES,
    zh: CHINESE_VOICES,
  }
}

/**
 * 음성 ID로 음성 정보 찾기
 */
export function findVoiceById(voiceId: string): VoiceInfo | null {
  const allVoices = [
    ...KOREAN_VOICES,
    ...ENGLISH_VOICES,
    ...JAPANESE_VOICES,
    ...CHINESE_VOICES,
  ]
  return allVoices.find((v) => v.id === voiceId) || null
}

/**
 * 언어 라벨
 */
export const LANGUAGE_LABELS: Record<VoiceLanguage, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
  zh: '中文',
}

/**
 * TTS 작업 응답
 */
interface TTSTaskResponse {
  code: number
  message: string
  data: {
    id: string
    status: string
    outputs?: string[]  // 동기 모드에서 결과 포함
  }
}

/**
 * TTS 결과 응답 (predictions 엔드포인트 형식)
 */
/**
 * TTS 결과 응답 타입
 */
interface TTSResultResponse {
  code: number
  message: string
  data: {
    id: string
    status: 'created' | 'processing' | 'completed' | 'failed'
    model?: string
    outputs?: string[]  // 오디오 URL 배열
    created_at?: string
  }
}

/**
 * TTS 작업 제출
 *
 * @param text 변환할 텍스트
 * @param voiceId 음성 ID
 * @param speed 속도 (0.5 ~ 2.0, 기본값 1.1)
 * @returns 작업 ID
 */
export async function submitTTSTask(
  text: string,
  voiceId: string,
  speed: number = 1.1,
  syncMode: boolean = false
): Promise<string> {
  console.log(`[TTS] submitTTSTask: voiceId=${voiceId}, text="${text.substring(0, 30)}...", syncMode=${syncMode}`)

  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${WAVESPEED_API_KEY}`,
    },
    body: JSON.stringify({
      text,
      voice_id: voiceId,
      speed: Math.max(0.5, Math.min(2.0, speed)),
      enable_sync_mode: syncMode,  // 동기 모드: 결과가 준비될 때까지 대기
    }),
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`TTS 작업 제출 실패: ${response.status} - ${errorText}`)
  }

  const result: TTSTaskResponse = await response.json()

  if (result.code !== 200) {
    throw new Error(`TTS 작업 제출 오류: ${result.message}`)
  }

  // 동기 모드 처리
  if (syncMode) {
    // 실패 상태 체크
    if (result.data.status === 'failed') {
      const errorData = result.data as { error?: string }
      throw new Error(`TTS 작업 실패: ${errorData.error || '알 수 없는 오류'}`)
    }

    // 결과가 있으면 반환
    if (result.data.outputs && result.data.outputs.length > 0) {
      console.log(`[TTS] 동기 모드 완료: ${result.data.outputs[0]}`)
      return result.data.outputs[0]
    }

    // 동기 모드인데 outputs이 없으면 폴링으로 전환
    console.log(`[TTS] 동기 모드에서 outputs 없음, 폴링으로 전환: taskId=${result.data.id}`)
    return await waitForTTSResult(result.data.id, 30, 1000)
  }

  console.log(`[TTS] 작업 제출 성공: taskId=${result.data.id}`)
  return result.data.id
}

/**
 * TTS 작업 상태 조회
 *
 * @param taskId 작업 ID
 * @returns 상태 및 결과
 */
export async function getTTSTaskStatus(taskId: string): Promise<TTSResultResponse['data']> {
  // TTS도 predictions 엔드포인트를 사용해야 함
  const TTS_PREDICTION_URL = 'https://api.wavespeed.ai/api/v3/predictions'
  const response = await fetch(`${TTS_PREDICTION_URL}/${taskId}/result`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${WAVESPEED_API_KEY}`,
    },
    cache: 'no-store',  // Next.js fetch 캐시 비활성화
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`TTS 상태 조회 실패: ${response.status} - ${errorText}`)
  }

  const result: TTSResultResponse = await response.json()

  if (result.code !== 200) {
    throw new Error(`TTS 상태 조회 오류: ${result.message}`)
  }

  return result.data
}

/**
 * TTS 작업 완료까지 폴링
 *
 * @param taskId 작업 ID
 * @param maxAttempts 최대 시도 횟수 (기본 60, 1분)
 * @param intervalMs 폴링 간격 (기본 1000ms)
 * @returns 오디오 URL
 */
export async function waitForTTSResult(
  taskId: string,
  maxAttempts: number = 60,
  intervalMs: number = 1000
): Promise<string> {
  let attempts = 0

  while (attempts < maxAttempts) {
    const status = await getTTSTaskStatus(taskId)

    // 디버그 로그 (5회마다 또는 완료/실패 시)
    if (attempts % 5 === 0 || status.status === 'completed' || status.status === 'failed') {
      console.log(`[TTS] taskId=${taskId}, attempt=${attempts + 1}/${maxAttempts}, status=${status.status}, outputs=${status.outputs?.length || 0}`)
    }

    if (status.status === 'completed' && status.outputs && status.outputs.length > 0) {
      return status.outputs[0]
    }

    if (status.status === 'failed') {
      throw new Error('TTS 작업 실패')
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs))
    attempts++
  }

  throw new Error('TTS 작업 시간 초과')
}

/**
 * 텍스트를 음성으로 변환 (원스텝)
 *
 * @param text 변환할 텍스트
 * @param voiceId 음성 ID
 * @param speed 속도 (0.5 ~ 2.0, 기본값 1.1)
 * @returns 오디오 URL
 */
export async function textToSpeech(
  text: string,
  voiceId: string,
  speed: number = 1.1
): Promise<string> {
  const taskId = await submitTTSTask(text, voiceId, speed)
  return await waitForTTSResult(taskId)
}

/**
 * 음성 프리뷰 생성
 * 샘플 텍스트로 짧은 오디오 생성 (프리뷰용 짧은 타임아웃 사용)
 *
 * @param voiceId 음성 ID
 * @returns 오디오 URL
 */
export async function generateVoicePreview(voiceId: string): Promise<string> {
  const voice = findVoiceById(voiceId)
  if (!voice) {
    throw new Error(`음성을 찾을 수 없습니다: ${voiceId}`)
  }

  // 동기 모드 사용: 폴링 없이 바로 결과 반환
  const audioUrl = await submitTTSTask(voice.sampleText, voiceId, 1.1, true)
  return audioUrl
}

// ============================================================
// InfiniteTalk (토킹 아바타 영상 생성)
// ============================================================

const INFINITETALK_URL = 'https://api.wavespeed.ai/api/v3/wavespeed-ai/infinitetalk'
const PREDICTION_RESULT_URL = 'https://api.wavespeed.ai/api/v3/predictions'

/**
 * InfiniteTalk 해상도 타입
 */
export type InfiniteTalkResolution = '480p' | '720p'

/**
 * InfiniteTalk 입력 타입
 */
export interface InfiniteTalkInput {
  audio: string           // 오디오 URL (TTS 결과)
  image: string           // 첫 프레임 이미지 URL
  mask_image?: string     // 마스크 이미지 (선택)
  prompt?: string         // 영상 생성 프롬프트 (선택)
  resolution?: InfiniteTalkResolution  // 해상도 (기본: 480p)
  seed?: number           // 시드 값 (기본: -1)
}

/**
 * InfiniteTalk 작업 응답
 */
interface InfiniteTalkTaskResponse {
  code: number
  message: string
  data: {
    id: string
    status: string
    model: string
    created_at: string
  }
}

/**
 * InfiniteTalk 결과 응답
 */
interface InfiniteTalkResultResponse {
  code: number
  message: string
  data: {
    id: string
    status: 'created' | 'processing' | 'completed' | 'failed'
    model: string
    outputs: string[]     // 영상 URL 배열
    created_at: string
    has_nsfw_contents?: boolean[]
    urls?: Record<string, string>
  }
}

/**
 * InfiniteTalk 작업 제출
 *
 * @param input 입력 데이터
 * @returns 작업 ID
 */
export async function submitInfiniteTalkTask(input: InfiniteTalkInput): Promise<string> {
  const response = await fetch(INFINITETALK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${WAVESPEED_API_KEY}`,
    },
    body: JSON.stringify({
      audio: input.audio,
      image: input.image,
      mask_image: input.mask_image,
      prompt: input.prompt,
      resolution: input.resolution || '480p',
      seed: input.seed ?? -1,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`InfiniteTalk 작업 제출 실패: ${response.status} - ${errorText}`)
  }

  const result: InfiniteTalkTaskResponse = await response.json()

  if (result.code !== 200) {
    throw new Error(`InfiniteTalk 작업 제출 오류: ${result.message}`)
  }

  return result.data.id
}

/**
 * InfiniteTalk 작업 결과 조회
 *
 * @param requestId 작업 ID
 * @returns 결과 데이터
 */
export async function getInfiniteTalkResult(requestId: string): Promise<InfiniteTalkResultResponse['data']> {
  const response = await fetch(`${PREDICTION_RESULT_URL}/${requestId}/result`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${WAVESPEED_API_KEY}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`InfiniteTalk 결과 조회 실패: ${response.status} - ${errorText}`)
  }

  const result: InfiniteTalkResultResponse = await response.json()

  if (result.code !== 200) {
    throw new Error(`InfiniteTalk 결과 조회 오류: ${result.message}`)
  }

  return result.data
}

/**
 * InfiniteTalk 작업 완료까지 폴링
 *
 * @param requestId 작업 ID
 * @param maxAttempts 최대 시도 횟수 (기본 120, 10분)
 * @param intervalMs 폴링 간격 (기본 5000ms)
 * @returns 영상 URL
 */
export async function waitForInfiniteTalkResult(
  requestId: string,
  maxAttempts: number = 120,
  intervalMs: number = 5000
): Promise<string> {
  let attempts = 0

  while (attempts < maxAttempts) {
    const result = await getInfiniteTalkResult(requestId)

    if (result.status === 'completed' && result.outputs && result.outputs.length > 0) {
      return result.outputs[0]
    }

    if (result.status === 'failed') {
      throw new Error('InfiniteTalk 영상 생성 실패')
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs))
    attempts++
  }

  throw new Error('InfiniteTalk 작업 시간 초과')
}

/**
 * InfiniteTalk 토킹 영상 생성 (원스텝)
 *
 * @param imageUrl 첫 프레임 이미지 URL
 * @param audioUrl TTS 오디오 URL
 * @param prompt 영상 생성 프롬프트 (선택)
 * @param resolution 해상도 (기본: 480p)
 * @returns 영상 URL
 */
export async function generateTalkingVideo(
  imageUrl: string,
  audioUrl: string,
  prompt?: string,
  resolution: InfiniteTalkResolution = '480p'
): Promise<string> {
  const requestId = await submitInfiniteTalkTask({
    image: imageUrl,
    audio: audioUrl,
    prompt,
    resolution,
  })

  return await waitForInfiniteTalkResult(requestId)
}

/**
 * InfiniteTalk 큐 제출 (fal.ai 호환 인터페이스)
 *
 * @param imageUrl 이미지 URL
 * @param audioUrl 오디오 URL
 * @param prompt 프롬프트 (선택)
 * @param resolution 해상도 (선택)
 * @returns 큐 제출 응답 (request_id 포함)
 */
export async function submitInfiniteTalkToQueue(
  imageUrl: string,
  audioUrl: string,
  prompt?: string,
  resolution: InfiniteTalkResolution = '480p'
): Promise<{ request_id: string }> {
  const requestId = await submitInfiniteTalkTask({
    image: imageUrl,
    audio: audioUrl,
    prompt,
    resolution,
  })

  return { request_id: requestId }
}

/**
 * InfiniteTalk 상태 조회 (fal.ai 호환 인터페이스)
 *
 * @param requestId 작업 ID
 * @returns 상태 정보
 */
export async function getInfiniteTalkQueueStatus(
  requestId: string
): Promise<{ status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' }> {
  const result = await getInfiniteTalkResult(requestId)

  const statusMap: Record<string, 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'> = {
    'created': 'IN_QUEUE',
    'processing': 'IN_PROGRESS',
    'completed': 'COMPLETED',
    'failed': 'FAILED',
  }

  return {
    status: statusMap[result.status] || 'IN_QUEUE',
  }
}

/**
 * InfiniteTalk 결과 조회 (fal.ai 호환 인터페이스)
 *
 * @param requestId 작업 ID
 * @returns 영상 정보
 */
export async function getInfiniteTalkQueueResponse(
  requestId: string
): Promise<{ videos: Array<{ url: string }> }> {
  const result = await getInfiniteTalkResult(requestId)

  if (result.status === 'failed') {
    throw new Error('InfiniteTalk 영상 생성 실패')
  }

  if (!result.outputs || result.outputs.length === 0) {
    throw new Error('생성된 영상이 없습니다')
  }

  return {
    videos: result.outputs.map((url) => ({ url })),
  }
}

// ============================================================
// Vidu Q2 Turbo Image-to-Video (영상 생성)
// ============================================================

const VIDU_Q2_TURBO_URL = 'https://api.wavespeed.ai/api/v3/vidu/image-to-video-q2-turbo'

/**
 * Vidu Q2 Turbo 해상도 타입
 */
export type ViduResolution = '540p' | '720p' | '1080p'

/**
 * Vidu Q2 Turbo 영상 길이 타입 (1-8초)
 */
export type ViduDuration = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

/**
 * Vidu Q2 Turbo 움직임 강도 타입
 */
export type ViduMovementAmplitude = 'auto' | 'small' | 'medium' | 'large'

/**
 * Vidu Q2 Turbo 입력 타입
 */
export interface ViduImageToVideoInput {
  prompt: string           // 영상 생성 프롬프트
  image: string            // 시작 이미지 URL
  duration?: ViduDuration  // 영상 길이 (1-8초, 기본 5)
  resolution?: ViduResolution  // 해상도 (기본 720p)
  bgm?: boolean            // 배경 음악 (기본 false)
  movement_amplitude?: ViduMovementAmplitude  // 움직임 강도 (기본 auto)
  seed?: number            // 시드 값 (-1 = 랜덤)
}

/**
 * Vidu Q2 Turbo 작업 응답
 */
interface ViduTaskResponse {
  code: number
  message: string
  data: {
    id: string
    status: string
    model: string
    created_at: string
    outputs: string[]
    has_nsfw_contents: boolean[]
    urls: Record<string, string>
  }
}

/**
 * Vidu Q2 Turbo 결과 응답
 */
interface ViduResultResponse {
  code: number
  message: string
  data: {
    id: string
    status: 'created' | 'processing' | 'completed' | 'failed'
    model: string
    outputs: string[]
    created_at: string
    has_nsfw_contents?: boolean[]
    urls?: Record<string, string>
  }
}

/**
 * Vidu Q2 Turbo 크레딧 계산
 *
 * 해상도와 길이에 따라 크레딧을 계산합니다:
 * - 540p: 초당 5 크레딧
 * - 720p: 초당 8 크레딧
 * - 1080p: 초당 12 크레딧
 *
 * @deprecated API에서 직접 VIDU_CREDIT_COST_PER_SECOND 상수를 사용하세요 (lib/credits)
 */
export function calculateViduCredits(
  duration: number,
  resolution: ViduResolution
): number {
  // 중앙 상수와 동일한 값 유지 (lib/credits/constants.ts의 VIDU_CREDIT_COST_PER_SECOND)
  const creditsPerSecond: Record<ViduResolution, number> = {
    '540p': 5,   // SD 화질 - VIDU_CREDIT_COST_PER_SECOND['540p']와 동일
    '720p': 8,   // HD 화질 - VIDU_CREDIT_COST_PER_SECOND['720p']와 동일
    '1080p': 12, // FHD 화질 - VIDU_CREDIT_COST_PER_SECOND['1080p']와 동일
  }

  return creditsPerSecond[resolution] * duration
}

/**
 * Vidu Q2 Turbo 작업 제출
 *
 * @param input 입력 데이터
 * @returns 작업 ID
 */
export async function submitViduImageToVideoTask(input: ViduImageToVideoInput): Promise<string> {
  const response = await fetch(VIDU_Q2_TURBO_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${WAVESPEED_API_KEY}`,
    },
    body: JSON.stringify({
      prompt: input.prompt,
      image: input.image,
      duration: input.duration ?? 5,
      resolution: input.resolution ?? '720p',
      bgm: input.bgm ?? false,
      movement_amplitude: input.movement_amplitude ?? 'auto',
      seed: input.seed ?? -1,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Vidu Q2 Turbo 작업 제출 실패: ${response.status} - ${errorText}`)
  }

  const result: ViduTaskResponse = await response.json()

  if (result.code !== 200) {
    throw new Error(`Vidu Q2 Turbo 작업 제출 오류: ${result.message}`)
  }

  return result.data.id
}

/**
 * Vidu Q2 Turbo 작업 결과 조회
 *
 * @param requestId 작업 ID
 * @returns 결과 데이터
 */
export async function getViduImageToVideoResult(requestId: string): Promise<ViduResultResponse['data']> {
  const response = await fetch(`${PREDICTION_RESULT_URL}/${requestId}/result`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${WAVESPEED_API_KEY}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Vidu Q2 Turbo 결과 조회 실패: ${response.status} - ${errorText}`)
  }

  const result: ViduResultResponse = await response.json()

  if (result.code !== 200) {
    throw new Error(`Vidu Q2 Turbo 결과 조회 오류: ${result.message}`)
  }

  return result.data
}

/**
 * Vidu Q2 Turbo 큐 제출 (fal.ai 호환 인터페이스)
 *
 * @param input 입력 데이터
 * @returns 큐 제출 응답 (request_id 포함)
 */
export async function submitViduToQueue(
  input: ViduImageToVideoInput
): Promise<{ request_id: string }> {
  const requestId = await submitViduImageToVideoTask(input)
  return { request_id: requestId }
}

/**
 * Vidu Q2 Turbo 상태 조회 (fal.ai 호환 인터페이스)
 *
 * @param requestId 작업 ID
 * @returns 상태 정보
 */
export async function getViduQueueStatus(
  requestId: string
): Promise<{ status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' }> {
  const result = await getViduImageToVideoResult(requestId)

  const statusMap: Record<string, 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'> = {
    'created': 'IN_QUEUE',
    'processing': 'IN_PROGRESS',
    'completed': 'COMPLETED',
    'failed': 'FAILED',
  }

  return {
    status: statusMap[result.status] || 'IN_QUEUE',
  }
}

/**
 * Vidu Q2 Turbo 결과 조회 (fal.ai 호환 인터페이스)
 *
 * @param requestId 작업 ID
 * @returns 영상 정보
 */
export async function getViduQueueResponse(
  requestId: string
): Promise<{ videos: Array<{ url: string }> }> {
  const result = await getViduImageToVideoResult(requestId)

  if (result.status === 'failed') {
    throw new Error('Vidu Q2 Turbo 영상 생성 실패')
  }

  if (!result.outputs || result.outputs.length === 0) {
    throw new Error('생성된 영상이 없습니다')
  }

  return {
    videos: result.outputs.map((url) => ({ url })),
  }
}

/**
 * Vidu Q2 Turbo 영상 생성 완료까지 폴링
 *
 * @param requestId 작업 ID
 * @param maxAttempts 최대 시도 횟수 (기본 120, 10분)
 * @param intervalMs 폴링 간격 (기본 5000ms)
 * @returns 영상 URL
 */
export async function waitForViduResult(
  requestId: string,
  maxAttempts: number = 120,
  intervalMs: number = 5000
): Promise<string> {
  let attempts = 0

  while (attempts < maxAttempts) {
    const result = await getViduImageToVideoResult(requestId)

    if (result.status === 'completed' && result.outputs && result.outputs.length > 0) {
      return result.outputs[0]
    }

    if (result.status === 'failed') {
      throw new Error('Vidu Q2 Turbo 영상 생성 실패')
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs))
    attempts++
  }

  throw new Error('Vidu Q2 Turbo 작업 시간 초과')
}
