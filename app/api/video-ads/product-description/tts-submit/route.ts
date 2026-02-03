/**
 * 제품 설명 영상 - TTS 작업 제출 API
 *
 * POST /api/video-ads/product-description/tts-submit
 * - TTS 작업을 Kie.ai에 제출하고 taskId를 반환
 * - 클라이언트에서 폴링하여 완료 확인
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { submitTTSToQueue } from '@/lib/kie/tts'

/**
 * POST /api/video-ads/product-description/tts-submit
 */
export async function POST(request: NextRequest) {
  try {
    // Supabase 인증 확인
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { script, voiceId, voiceName, languageCode } = body

    if (!script?.trim()) {
      return NextResponse.json({ error: 'Script is required' }, { status: 400 })
    }

    if (!voiceId) {
      return NextResponse.json({ error: 'Voice ID is required' }, { status: 400 })
    }

    console.log('[TTS Submit] Kie.ai ElevenLabs v3 TTS 작업 제출:', voiceId)

    // TTS 작업 제출 (taskId만 반환, 완료 대기 X)
    const { request_id: taskId } = await submitTTSToQueue(script.trim(), voiceId, {
      stability: 0.5,
      languageCode: languageCode || 'auto',
    })

    console.log(`[TTS Submit] 작업 제출 완료: taskId=${taskId}`)

    return NextResponse.json({
      taskId,
      voiceId,
      voiceName,
      provider: 'kie-elevenlabs-v3',
    })
  } catch (error) {
    console.error('[TTS Submit] 오류:', error)
    return NextResponse.json(
      { error: 'Failed to submit TTS task' },
      { status: 500 }
    )
  }
}
