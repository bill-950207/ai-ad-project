/**
 * Cloudflare R2 스토리지 클라이언트
 *
 * 생성된 아바타 이미지를 Cloudflare R2에 업로드하고 관리합니다.
 * AWS S3 호환 API를 사용합니다.
 *
 * 이미지 저장 정책:
 * - 원본 이미지: 원본 품질 그대로 저장 (재가공용)
 * - 압축 이미지: WebP 형식으로 압축하여 저장 (조회용)
 *
 * 업로드 방식:
 * - Presigned URL을 통한 클라이언트 직접 업로드
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

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

/** Presigned URL 만료 시간 (초) */
const PRESIGNED_URL_EXPIRES_IN = 60 * 5  // 5분

// ============================================================
// 타입 정의
// ============================================================

/** Presigned URL 생성 옵션 */
interface PresignedUrlOptions {
  fileName: string      // 저장할 파일 이름 (확장자 포함)
  contentType: string   // MIME 타입
  folder?: string       // 저장 폴더 경로 (기본: 'avatars')
  type: 'original' | 'compressed'  // 이미지 타입
}

/** Presigned URL 응답 */
export interface PresignedUrlResult {
  uploadUrl: string     // 업로드용 presigned URL
  publicUrl: string     // 업로드 완료 후 공개 URL
  key: string           // R2 저장 키
}

/** 아바타 이미지 업로드 URL 세트 */
export interface AvatarUploadUrls {
  original: PresignedUrlResult    // 원본 이미지 업로드 정보
  compressed: PresignedUrlResult  // 압축 이미지 업로드 정보
}

// ============================================================
// 공개 함수
// ============================================================

/**
 * Presigned URL 생성
 *
 * 클라이언트에서 직접 R2에 업로드할 수 있는 서명된 URL을 생성합니다.
 *
 * @param options - 업로드 옵션
 * @returns Presigned URL 및 공개 URL
 */
export async function generatePresignedUrl({
  fileName,
  contentType,
  folder = 'avatars',
  type,
}: PresignedUrlOptions): Promise<PresignedUrlResult> {
  // R2 저장 키 생성
  const key = `${folder}/${type}/${fileName}`

  // PutObject 명령 생성
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  })

  // Presigned URL 생성
  const uploadUrl = await getSignedUrl(r2Client, command, {
    expiresIn: PRESIGNED_URL_EXPIRES_IN,
  })

  // 공개 URL 생성
  const publicUrl = `${R2_PUBLIC_URL}/${key}`

  return {
    uploadUrl,
    publicUrl,
    key,
  }
}

/**
 * 아바타 이미지용 업로드 URL 세트 생성
 *
 * 원본과 압축 이미지를 위한 presigned URL을 모두 생성합니다.
 *
 * @param avatarId - 아바타 ID
 * @param originalExt - 원본 이미지 확장자 (기본: 'png')
 * @returns 원본 및 압축 이미지 업로드 URL
 */
export async function generateAvatarUploadUrls(
  avatarId: string,
  originalExt: string = 'png'
): Promise<AvatarUploadUrls> {
  const timestamp = Date.now()
  const baseFileName = `${avatarId}_${timestamp}`

  // 원본 이미지용 presigned URL
  const original = await generatePresignedUrl({
    fileName: `${baseFileName}.${originalExt}`,
    contentType: `image/${originalExt === 'jpg' ? 'jpeg' : originalExt}`,
    folder: 'avatars',
    type: 'original',
  })

  // 압축 이미지용 presigned URL (WebP)
  const compressed = await generatePresignedUrl({
    fileName: `${baseFileName}.webp`,
    contentType: 'image/webp',
    folder: 'avatars',
    type: 'compressed',
  })

  return {
    original,
    compressed,
  }
}

/**
 * 아바타 이미지용 고유 파일명 생성
 *
 * 아바타 ID와 타임스탬프를 조합하여 고유한 파일명을 생성합니다.
 * 확장자는 포함하지 않습니다.
 *
 * @param avatarId - 아바타 ID
 * @returns 생성된 파일명 (확장자 없음)
 */
export function generateAvatarFileName(avatarId: string): string {
  const timestamp = Date.now()
  return `${avatarId}_${timestamp}`
}

/**
 * R2 공개 URL 생성
 *
 * 저장 키로부터 공개 접근 URL을 생성합니다.
 *
 * @param key - R2 저장 키
 * @returns 공개 URL
 */
export function getPublicUrl(key: string): string {
  return `${R2_PUBLIC_URL}/${key}`
}
