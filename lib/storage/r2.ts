/**
 * Cloudflare R2 스토리지 클라이언트
 *
 * 생성된 아바타 이미지를 Cloudflare R2에 업로드하고 관리합니다.
 * AWS S3 호환 API를 사용합니다.
 *
 * 이미지 저장 정책:
 * - 원본 이미지: 원본 품질 그대로 저장 (재가공용)
 * - 압축 이미지: WebP 형식으로 압축하여 저장 (조회용)
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'

// ============================================================
// 환경 변수 설정
// ============================================================

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!          // Cloudflare 계정 ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!    // R2 액세스 키 ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!  // R2 시크릿 액세스 키
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!        // R2 버킷 이름
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!          // 공개 접근 URL (CDN)

// ============================================================
// S3 클라이언트 설정
// ============================================================

// R2용 S3 호환 클라이언트 생성
const r2Client = new S3Client({
  region: 'auto',  // R2는 자동 리전 사용
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

// ============================================================
// 상수 정의
// ============================================================

/** WebP 압축 품질 (0-100) */
const WEBP_QUALITY = 85

// ============================================================
// 타입 정의
// ============================================================

/** 이미지 업로드 옵션 */
interface UploadImageOptions {
  imageUrl: string    // 원본 이미지 URL (다운로드할 URL)
  fileName: string    // 저장할 파일 이름 (확장자 제외)
  folder?: string     // 저장 폴더 경로 (기본: 'avatars')
}

/** 이미지 업로드 결과 (원본 + 압축) */
export interface UploadImageResult {
  originalUrl: string    // 원본 이미지 URL (재가공용)
  compressedUrl: string  // 압축된 WebP 이미지 URL (조회용)
}

/** 버퍼 업로드 옵션 */
interface UploadBufferOptions {
  buffer: Buffer        // 업로드할 버퍼
  key: string           // R2 키 (경로/파일명)
  contentType: string   // MIME 타입
}

// ============================================================
// 내부 함수
// ============================================================

/**
 * 버퍼를 R2에 업로드
 *
 * @param options - 업로드 옵션
 * @returns 업로드된 파일의 공개 URL
 */
async function uploadBufferToR2({ buffer, key, contentType }: UploadBufferOptions): Promise<string> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  )

  return `${R2_PUBLIC_URL}/${key}`
}

/**
 * 이미지를 WebP 형식으로 압축
 *
 * @param imageBuffer - 원본 이미지 버퍼
 * @returns 압축된 WebP 이미지 버퍼
 */
async function compressToWebP(imageBuffer: Buffer): Promise<Buffer> {
  return sharp(imageBuffer)
    .webp({ quality: WEBP_QUALITY })
    .toBuffer()
}

// ============================================================
// 공개 함수
// ============================================================

/**
 * URL에서 이미지를 다운로드하여 R2에 원본과 압축본 모두 업로드
 *
 * fal.ai에서 생성된 이미지를 다운로드하고:
 * 1. 원본 이미지를 R2에 저장 (재가공용)
 * 2. WebP로 압축한 이미지를 R2에 저장 (조회용)
 *
 * @param options - 업로드 옵션
 * @returns 원본 및 압축 이미지 URL
 */
export async function uploadImageToR2({
  imageUrl,
  fileName,
  folder = 'avatars',
}: UploadImageOptions): Promise<UploadImageResult> {
  // 원본 URL에서 이미지 다운로드
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`이미지 다운로드 실패: ${response.statusText}`)
  }

  // 원본 콘텐츠 타입 및 이미지 데이터 추출
  const contentType = response.headers.get('content-type') || 'image/png'
  const originalBuffer = Buffer.from(await response.arrayBuffer())

  // 원본 이미지 확장자 결정
  const originalExt = contentType.includes('jpeg') || contentType.includes('jpg')
    ? 'jpg'
    : contentType.includes('webp')
    ? 'webp'
    : 'png'

  // 1. 원본 이미지 업로드
  const originalKey = `${folder}/original/${fileName}.${originalExt}`
  const originalUrl = await uploadBufferToR2({
    buffer: originalBuffer,
    key: originalKey,
    contentType,
  })

  // 2. WebP로 압축 후 업로드
  const compressedBuffer = await compressToWebP(originalBuffer)
  const compressedKey = `${folder}/compressed/${fileName}.webp`
  const compressedUrl = await uploadBufferToR2({
    buffer: compressedBuffer,
    key: compressedKey,
    contentType: 'image/webp',
  })

  return {
    originalUrl,
    compressedUrl,
  }
}

/**
 * 아바타 이미지용 고유 파일명 생성
 *
 * 아바타 ID와 타임스탬프를 조합하여 고유한 파일명을 생성합니다.
 * 확장자는 포함하지 않습니다 (uploadImageToR2에서 처리).
 *
 * @param avatarId - 아바타 ID
 * @returns 생성된 파일명 (확장자 없음)
 */
export function generateAvatarFileName(avatarId: string): string {
  const timestamp = Date.now()
  return `${avatarId}_${timestamp}`
}
