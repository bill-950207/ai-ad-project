/**
 * Cloudflare R2 스토리지 클라이언트
 *
 * 생성된 아바타 이미지를 Cloudflare R2에 업로드하고 관리합니다.
 * AWS S3 호환 API를 사용합니다.
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

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
// 타입 정의
// ============================================================

/** 이미지 업로드 옵션 */
interface UploadImageOptions {
  imageUrl: string    // 원본 이미지 URL (다운로드할 URL)
  fileName: string    // 저장할 파일 이름
  folder?: string     // 저장 폴더 경로 (기본: 'avatars')
}

// ============================================================
// 함수
// ============================================================

/**
 * URL에서 이미지를 다운로드하여 R2에 업로드
 *
 * fal.ai에서 생성된 이미지를 다운로드하고 R2에 영구 저장합니다.
 *
 * @param options - 업로드 옵션
 * @returns 업로드된 이미지의 공개 URL
 */
export async function uploadImageToR2({
  imageUrl,
  fileName,
  folder = 'avatars',
}: UploadImageOptions): Promise<string> {
  // 원본 URL에서 이미지 다운로드
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`이미지 다운로드 실패: ${response.statusText}`)
  }

  // 콘텐츠 타입 및 이미지 데이터 추출
  const contentType = response.headers.get('content-type') || 'image/png'
  const imageBuffer = await response.arrayBuffer()

  // R2 저장 경로 생성 (폴더/파일명)
  const key = `${folder}/${fileName}`

  // R2에 업로드
  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: Buffer.from(imageBuffer),
      ContentType: contentType,
    })
  )

  // 공개 URL 반환
  return `${R2_PUBLIC_URL}/${key}`
}

/**
 * 아바타 이미지용 고유 파일명 생성
 *
 * 아바타 ID와 타임스탬프를 조합하여 고유한 파일명을 생성합니다.
 *
 * @param avatarId - 아바타 ID
 * @param extension - 파일 확장자 (기본: 'png')
 * @returns 생성된 파일명
 */
export function generateAvatarFileName(avatarId: string, extension: string = 'png'): string {
  const timestamp = Date.now()
  return `${avatarId}_${timestamp}.${extension}`
}
