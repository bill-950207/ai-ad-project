/**
 * FFmpeg 비디오 처리 유틸리티
 *
 * 여러 비디오를 하나로 합치는 기능을 제공합니다.
 */

import ffmpeg from 'fluent-ffmpeg'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'
import { execSync } from 'child_process'

// FFmpeg 경로 설정 (시스템 또는 node_modules에서 찾기)
function getFFmpegPath(): string {
  // 1. 시스템에 설치된 ffmpeg 확인
  try {
    const systemPath = execSync('which ffmpeg', { encoding: 'utf-8' }).trim()
    if (systemPath) {
      console.log('Using system FFmpeg:', systemPath)
      return systemPath
    }
  } catch {
    // 시스템에 없음
  }

  // 2. node_modules에서 직접 경로 지정 (darwin-arm64 for M1/M2 Mac)
  const possiblePaths = [
    path.join(process.cwd(), 'node_modules/@ffmpeg-installer/darwin-arm64/ffmpeg'),
    path.join(process.cwd(), 'node_modules/@ffmpeg-installer/darwin-x64/ffmpeg'),
    path.join(process.cwd(), 'node_modules/@ffmpeg-installer/linux-x64/ffmpeg'),
    path.join(process.cwd(), 'node_modules/@ffmpeg-installer/win32-x64/ffmpeg.exe'),
  ]

  for (const p of possiblePaths) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const nodeFs = require('fs')
      nodeFs.accessSync(p, nodeFs.constants.X_OK)
      console.log('Using node_modules FFmpeg:', p)
      return p
    } catch {
      // 이 경로에 없음
    }
  }

  throw new Error('FFmpeg binary not found. Please install ffmpeg or @ffmpeg-installer/ffmpeg')
}

const ffmpegPath = getFFmpegPath()
ffmpeg.setFfmpegPath(ffmpegPath)

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
    console.log('FFmpeg binary:', ffmpegPath)

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
