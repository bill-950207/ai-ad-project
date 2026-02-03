/**
 * 제품 설명 영상 - TTS 상태 조회 API
 *
 * GET /api/video-ads/product-description/tts-status?taskId=xxx
 * - TTS 작업 상태 조회
 * - 완료 시 오디오 다운로드 → R2 업로드 → URL 반환
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTTSQueueStatus, getTTSQueueResponse, downloadAudio } from '@/lib/kie/tts'
import { normalizeAudioVolume } from '@/lib/video/ffmpeg'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'

// R2 클라이언트 설정
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const R2_BUCKET = process.env.R2_BUCKET_NAME!
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!

/**
 * GET /api/video-ads/product-description/tts-status
 */
export async function GET(request: NextRequest) {
  try {
    // Supabase 인증 확인
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 })
    }

    console.log(`[TTS Status] 상태 조회: taskId=${taskId}`)

    // TTS 상태 조회
    const queueStatus = await getTTSQueueStatus(taskId)

    if (queueStatus.status === 'COMPLETED') {
      // 완료됨 - 오디오 다운로드 및 R2 업로드
      console.log(`[TTS Status] 완료됨, 오디오 다운로드 시작`)

      const result = await getTTSQueueResponse(taskId)
      let audioBuffer = await downloadAudio(result.audioUrl)

      // 오디오 볼륨 정규화
      try {
        console.log('[TTS Status] 오디오 볼륨 정규화 시작...')
        audioBuffer = await normalizeAudioVolume(audioBuffer, 1.5)
        console.log('[TTS Status] 오디오 볼륨 정규화 완료')
      } catch (normalizeError) {
        console.warn('[TTS Status] 오디오 정규화 실패, 원본 사용:', normalizeError)
      }

      // R2에 오디오 파일 업로드
      const audioId = randomUUID()
      const audioKey = `video-ads/audio/${user.id}/${audioId}.mp3`

      await r2Client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: audioKey,
          Body: audioBuffer,
          ContentType: 'audio/mpeg',
        })
      )

      const r2AudioUrl = `${R2_PUBLIC_URL}/${audioKey}`
      console.log(`[TTS Status] R2 업로드 완료: ${r2AudioUrl}`)

      return NextResponse.json({
        status: 'COMPLETED',
        audioUrl: r2AudioUrl,
      })
    }

    if (queueStatus.status === 'FAILED') {
      console.error(`[TTS Status] 실패: taskId=${taskId}`)
      return NextResponse.json({
        status: 'FAILED',
        error: 'TTS generation failed',
      })
    }

    // 진행 중
    console.log(`[TTS Status] 진행 중: ${queueStatus.status}`)
    return NextResponse.json({
      status: queueStatus.status,
    })
  } catch (error) {
    console.error('[TTS Status] 오류:', error)
    return NextResponse.json(
      { error: 'Failed to check TTS status' },
      { status: 500 }
    )
  }
}
