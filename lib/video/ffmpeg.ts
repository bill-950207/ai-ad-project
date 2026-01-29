/**
 * FFmpeg 비디오 처리 유틸리티
 *
 * 여러 비디오를 하나로 합치는 기능을 제공합니다.
 */

import ffmpeg from 'fluent-ffmpeg'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

// @ffmpeg-installer/ffmpeg 패키지에서 경로 가져오기
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg')
ffmpeg.setFfmpegPath(ffmpegInstaller.path)

/**
 * 여러 비디오 URL을 하나의 비디오로 합칩니다.
 *
 * @param videoUrls - 합칠 비디오 URL 배열 (순서대로 합쳐짐)
 * @returns 합쳐진 비디오의 Buffer
 */
export async function concatenateVideos(videoUrls: string[]): Promise<Buffer> {
  console.log('concatenateVideos called with', videoUrls.length, 'URLs')

  if (videoUrls.length === 0) {
    throw new Error('At least one video URL is required')
  }

  if (videoUrls.length === 1) {
    // 비디오가 하나뿐이면 그냥 다운로드해서 반환
    console.log('Only one video, downloading directly...')
    const response = await fetch(videoUrls[0])
    if (!response.ok) {
      throw new Error(`Failed to download single video: ${response.status} ${response.statusText}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  // 임시 디렉토리 생성
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'video-concat-'))
  console.log('Temp directory created:', tempDir)
  const tempFiles: string[] = []
  const concatListPath = path.join(tempDir, 'concat.txt')
  const outputPath = path.join(tempDir, 'output.mp4')

  try {
    // 1. 모든 비디오 다운로드
    console.log(`Downloading ${videoUrls.length} videos...`)
    for (let i = 0; i < videoUrls.length; i++) {
      console.log(`Downloading video ${i + 1}: ${videoUrls[i].substring(0, 100)}...`)
      const response = await fetch(videoUrls[i])
      if (!response.ok) {
        throw new Error(`Failed to download video ${i + 1}: ${response.status} ${response.statusText}`)
      }
      const arrayBuffer = await response.arrayBuffer()
      console.log(`Video ${i + 1} size: ${arrayBuffer.byteLength} bytes`)
      const tempFilePath = path.join(tempDir, `video_${i}.mp4`)
      await fs.writeFile(tempFilePath, Buffer.from(arrayBuffer))
      tempFiles.push(tempFilePath)
      console.log(`Downloaded video ${i + 1}/${videoUrls.length}`)
    }

    // 2. FFmpeg concat demuxer용 파일 리스트 생성
    const concatContent = tempFiles
      .map((filePath) => `file '${filePath}'`)
      .join('\n')
    await fs.writeFile(concatListPath, concatContent)

    // 3. FFmpeg로 비디오 합치기
    console.log('Concatenating videos with FFmpeg...')
    console.log('Concat list content:', concatContent)
    console.log('Output path:', outputPath)
    console.log('FFmpeg binary:', ffmpegInstaller.path)

    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(concatListPath)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions([
          '-c', 'copy',  // 재인코딩 없이 복사 (빠름)
          '-movflags', '+faststart',  // 웹 스트리밍 최적화
        ])
        .output(outputPath)
        .on('start', (cmd: string) => {
          console.log('FFmpeg command:', cmd)
        })
        .on('progress', (progress: { percent?: number }) => {
          if (progress.percent) {
            console.log(`Progress: ${progress.percent.toFixed(1)}%`)
          }
        })
        .on('end', () => {
          console.log('Video concatenation completed')
          resolve()
        })
        .on('error', (err: Error) => {
          console.error('FFmpeg error:', err)
          reject(err)
        })
        .run()
    })

    // 4. 결과 파일 읽기
    const resultBuffer = await fs.readFile(outputPath)
    return resultBuffer
  } finally {
    // 임시 파일 정리
    try {
      await fs.rm(tempDir, { recursive: true, force: true })
    } catch (cleanupError) {
      console.warn('Failed to cleanup temp files:', cleanupError)
    }
  }
}

/**
 * 비디오를 재인코딩하여 합칩니다.
 * 서로 다른 코덱/해상도의 비디오를 합칠 때 사용합니다.
 *
 * @param videoUrls - 합칠 비디오 URL 배열
 * @param options - 인코딩 옵션
 * @returns 합쳐진 비디오의 Buffer
 */
export async function concatenateVideosWithReencode(
  videoUrls: string[],
  options: {
    width?: number
    height?: number
    fps?: number
    videoBitrate?: string
    audioBitrate?: string
  } = {}
): Promise<Buffer> {
  if (videoUrls.length === 0) {
    throw new Error('At least one video URL is required')
  }

  const {
    width = 1080,
    height = 1920,
    fps = 30,
    videoBitrate = '4000k',
    audioBitrate = '128k',
  } = options

  // 임시 디렉토리 생성
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'video-concat-'))
  const tempFiles: string[] = []
  const outputPath = path.join(tempDir, 'output.mp4')

  try {
    // 1. 모든 비디오 다운로드
    for (let i = 0; i < videoUrls.length; i++) {
      const response = await fetch(videoUrls[i])
      if (!response.ok) {
        throw new Error(`Failed to download video ${i + 1}`)
      }
      const arrayBuffer = await response.arrayBuffer()
      const tempFilePath = path.join(tempDir, `video_${i}.mp4`)
      await fs.writeFile(tempFilePath, Buffer.from(arrayBuffer))
      tempFiles.push(tempFilePath)
    }

    // 2. FFmpeg로 비디오 합치기 (재인코딩)
    await new Promise<void>((resolve, reject) => {
      let command = ffmpeg()

      // 모든 입력 파일 추가
      tempFiles.forEach((file) => {
        command = command.input(file)
      })

      // 필터 복합체 생성 (각 비디오를 동일한 해상도/fps로 변환)
      const filterInputs = tempFiles.map((_, i) => `[${i}:v]`)
      const filterComplex = tempFiles
        .map((_, i) => `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,fps=${fps}[v${i}]`)
        .join(';') +
        ';' +
        tempFiles.map((_, i) => `[v${i}]`).join('') +
        `concat=n=${tempFiles.length}:v=1:a=0[outv]`

      command
        .complexFilter(filterComplex)
        .outputOptions([
          '-map', '[outv]',
          '-c:v', 'libx264',
          '-preset', 'medium',
          '-crf', '23',
          '-b:v', videoBitrate,
          '-movflags', '+faststart',
        ])
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(err))
        .run()
    })

    // 3. 결과 파일 읽기
    const resultBuffer = await fs.readFile(outputPath)
    return resultBuffer
  } finally {
    // 임시 파일 정리
    try {
      await fs.rm(tempDir, { recursive: true, force: true })
    } catch {
      // 무시
    }
  }
}

/**
 * 오디오 파일의 특정 구간을 트리밍합니다.
 *
 * @param audioUrl - 오디오 URL
 * @param startTime - 시작 시간 (초)
 * @param endTime - 끝 시간 (초)
 * @returns 트리밍된 오디오 Buffer
 */
export async function trimAudio(
  audioUrl: string,
  startTime: number,
  endTime: number
): Promise<Buffer> {
  console.log(`trimAudio: ${startTime}s ~ ${endTime}s from ${audioUrl.substring(0, 50)}...`)

  if (startTime >= endTime) {
    throw new Error('startTime must be less than endTime')
  }

  const duration = endTime - startTime
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'audio-trim-'))
  const inputPath = path.join(tempDir, 'input.mp3')
  const outputPath = path.join(tempDir, 'output.mp3')

  try {
    // 1. 오디오 다운로드
    const response = await fetch(audioUrl)
    if (!response.ok) {
      throw new Error(`Failed to download audio: ${response.status}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    await fs.writeFile(inputPath, Buffer.from(arrayBuffer))

    // 2. FFmpeg로 트리밍
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(inputPath)
        .inputOptions([`-ss`, `${startTime}`])
        .outputOptions([`-t`, `${duration}`, '-c', 'copy'])
        .output(outputPath)
        .on('start', (cmd: string) => {
          console.log('FFmpeg trim command:', cmd)
        })
        .on('end', () => {
          console.log('Audio trimming completed')
          resolve()
        })
        .on('error', (err: Error) => {
          console.error('FFmpeg trim error:', err)
          reject(err)
        })
        .run()
    })

    // 3. 결과 파일 읽기
    const resultBuffer = await fs.readFile(outputPath)
    return resultBuffer
  } finally {
    try {
      await fs.rm(tempDir, { recursive: true, force: true })
    } catch {
      // 무시
    }
  }
}

/**
 * 비디오에 배경 음악(BGM)을 합성합니다.
 * 원본 비디오의 오디오와 BGM을 믹싱하여 합성합니다.
 *
 * @param options - 합성 옵션
 * @returns 합성된 비디오 Buffer
 */
export async function mergeVideoWithAudio(options: {
  videoUrl: string
  audioUrl: string
  audioStartTime?: number
  audioEndTime?: number
  videoVolume?: number   // 원본 오디오 볼륨 (0~1, 기본 1.0)
  musicVolume?: number   // BGM 볼륨 (0~1, 기본 0.3)
}): Promise<Buffer> {
  const {
    videoUrl,
    audioUrl,
    audioStartTime = 0,
    audioEndTime,
    videoVolume = 1.0,
    musicVolume = 0.3,
  } = options

  console.log('mergeVideoWithAudio:', {
    videoUrl: videoUrl.substring(0, 50) + '...',
    audioUrl: audioUrl.substring(0, 50) + '...',
    audioStartTime,
    audioEndTime,
    videoVolume,
    musicVolume,
  })

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'video-audio-merge-'))
  const videoPath = path.join(tempDir, 'video.mp4')
  const audioPath = path.join(tempDir, 'audio.mp3')
  const outputPath = path.join(tempDir, 'output.mp4')

  try {
    // 1. 비디오와 오디오 다운로드
    console.log('Downloading video and audio...')
    const [videoRes, audioRes] = await Promise.all([
      fetch(videoUrl),
      fetch(audioUrl),
    ])

    if (!videoRes.ok) {
      throw new Error(`Failed to download video: ${videoRes.status}`)
    }
    if (!audioRes.ok) {
      throw new Error(`Failed to download audio: ${audioRes.status}`)
    }

    const [videoBuffer, audioBuffer] = await Promise.all([
      videoRes.arrayBuffer(),
      audioRes.arrayBuffer(),
    ])

    await Promise.all([
      fs.writeFile(videoPath, Buffer.from(videoBuffer)),
      fs.writeFile(audioPath, Buffer.from(audioBuffer)),
    ])

    console.log('Files downloaded:', {
      videoSize: videoBuffer.byteLength,
      audioSize: audioBuffer.byteLength,
    })

    // 2. 비디오 길이 확인 (오디오 트림 범위 결정용)
    const videoDuration = await getMediaDuration(videoPath)
    console.log('Video duration:', videoDuration)

    // 오디오 끝 시간 설정 (지정되지 않으면 비디오 길이만큼)
    const actualAudioEndTime = audioEndTime ?? (audioStartTime + videoDuration)

    // 3. FFmpeg로 비디오 + 오디오 합성
    // 원본 비디오에 오디오가 있는 경우와 없는 경우 모두 처리
    await new Promise<void>((resolve, reject) => {
      // 필터 복합체: 원본 오디오 볼륨 조절 + BGM 트림 및 볼륨 조절 + 믹싱
      // 비디오에 오디오가 없을 수 있으므로 anullsrc로 무음 스트림 생성
      const filterComplex = [
        // BGM 트림 및 볼륨 조절 (비디오 길이에 맞춤)
        `[1:a]atrim=start=${audioStartTime}:end=${actualAudioEndTime},asetpts=PTS-STARTPTS,volume=${musicVolume}[bgm]`,
        // 원본 오디오 볼륨 조절 (없으면 무음 사용)
        `[0:a]volume=${videoVolume}[orig]`,
        // 두 오디오 믹싱 (비디오 길이에 맞춤)
        `[orig][bgm]amix=inputs=2:duration=first:dropout_transition=2[aout]`,
      ].join(';')

      ffmpeg()
        .input(videoPath)
        .input(audioPath)
        .complexFilter(filterComplex)
        .outputOptions([
          '-map', '0:v',           // 비디오 스트림
          '-map', '[aout]',        // 믹싱된 오디오 스트림
          '-c:v', 'copy',          // 비디오 재인코딩 안함
          '-c:a', 'aac',           // 오디오 AAC 인코딩
          '-b:a', '192k',          // 오디오 비트레이트
          '-shortest',             // 짧은 스트림에 맞춤
          '-movflags', '+faststart',
        ])
        .output(outputPath)
        .on('start', (cmd: string) => {
          console.log('FFmpeg merge command:', cmd)
        })
        .on('progress', (progress: { percent?: number }) => {
          if (progress.percent) {
            console.log(`Merge progress: ${progress.percent.toFixed(1)}%`)
          }
        })
        .on('end', () => {
          console.log('Video-audio merge completed')
          resolve()
        })
        .on('error', (err: Error) => {
          console.error('FFmpeg merge error:', err)
          // 원본 비디오에 오디오가 없는 경우 다시 시도
          // - "Stream map" / "does not contain": 오디오 스트림 없음
          // - "Invalid argument": 필터그래프 바인딩 실패 (오디오 없음)
          const noAudioPatterns = ['Stream map', 'does not contain', 'Invalid argument', 'filtergraph']
          const isNoAudioError = noAudioPatterns.some(p => err.message.includes(p))
          if (isNoAudioError) {
            console.log('Retrying without original audio...')
            mergeWithoutOriginalAudio()
              .then(resolve)
              .catch(reject)
          } else {
            reject(err)
          }
        })
        .run()

      // 원본 비디오에 오디오가 없는 경우 BGM만 사용
      async function mergeWithoutOriginalAudio(): Promise<void> {
        return new Promise((res, rej) => {
          const simpleFilter = `[1:a]atrim=start=${audioStartTime}:end=${actualAudioEndTime},asetpts=PTS-STARTPTS,volume=${musicVolume}[aout]`

          ffmpeg()
            .input(videoPath)
            .input(audioPath)
            .complexFilter(simpleFilter)
            .outputOptions([
              '-map', '0:v',
              '-map', '[aout]',
              '-c:v', 'copy',
              '-c:a', 'aac',
              '-b:a', '192k',
              '-shortest',
              '-movflags', '+faststart',
            ])
            .output(outputPath)
            .on('start', (cmd: string) => {
              console.log('FFmpeg retry command:', cmd)
            })
            .on('end', () => {
              console.log('Video-audio merge (no original audio) completed')
              res()
            })
            .on('error', (err: Error) => {
              console.error('FFmpeg retry error:', err)
              rej(err)
            })
            .run()
        })
      }
    })

    // 4. 결과 파일 읽기
    const resultBuffer = await fs.readFile(outputPath)
    return resultBuffer
  } finally {
    try {
      await fs.rm(tempDir, { recursive: true, force: true })
    } catch {
      // 무시
    }
  }
}

/**
 * 오디오 볼륨을 정규화/증폭합니다.
 * loudnorm 필터로 일정한 음량으로 정규화하고 추가로 볼륨을 증폭합니다.
 *
 * @param audioBuffer - 원본 오디오 Buffer
 * @param volumeBoost - 추가 볼륨 증폭 배수 (기본 1.5 = 150%)
 * @returns 정규화된 오디오 Buffer
 */
export async function normalizeAudioVolume(
  audioBuffer: Buffer,
  volumeBoost: number = 1.5
): Promise<Buffer> {
  console.log('normalizeAudioVolume: 시작, 원본 크기:', audioBuffer.byteLength, 'bytes, boost:', volumeBoost)

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'audio-normalize-'))
  const inputPath = path.join(tempDir, 'input.mp3')
  const outputPath = path.join(tempDir, 'output.mp3')

  try {
    // 1. 오디오 파일 저장
    await fs.writeFile(inputPath, audioBuffer)

    // 2. FFmpeg로 정규화 + 볼륨 증폭
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(inputPath)
        .audioFilters([
          // EBU R128 표준으로 음량 정규화 (-14 LUFS 타겟)
          'loudnorm=I=-14:TP=-1:LRA=11',
          // 추가 볼륨 증폭
          `volume=${volumeBoost}`,
        ])
        .outputOptions([
          '-c:a', 'libmp3lame',
          '-b:a', '192k',  // 비트레이트 증가
        ])
        .output(outputPath)
        .on('start', (cmd: string) => {
          console.log('FFmpeg normalize command:', cmd)
        })
        .on('end', () => {
          console.log('Audio normalization completed')
          resolve()
        })
        .on('error', (err: Error) => {
          console.error('FFmpeg normalize error:', err)
          reject(err)
        })
        .run()
    })

    // 3. 결과 파일 읽기
    const resultBuffer = await fs.readFile(outputPath)
    console.log('normalizeAudioVolume: 완료, 결과 크기:', resultBuffer.byteLength, 'bytes')
    return resultBuffer
  } finally {
    try {
      await fs.rm(tempDir, { recursive: true, force: true })
    } catch {
      // 무시
    }
  }
}

/**
 * 미디어 파일의 길이(초)를 반환합니다.
 */
async function getMediaDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err)
        return
      }
      const duration = metadata.format.duration || 0
      resolve(duration)
    })
  })
}
