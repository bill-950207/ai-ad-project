/**
 * 이미지 압축 유틸리티
 *
 * WebP 형식으로 이미지를 압축하고 R2에 업로드하는 유틸리티 함수
 * 원본과 압축본을 분리하여 저장합니다.
 */

import sharp from 'sharp'
import { uploadBufferToR2 } from '@/lib/storage/r2'

/** 압축 옵션 */
interface CompressOptions {
  quality?: number  // WebP 품질 (0-100, 기본: 85)
}

/** R2 업로드 결과 */
export interface ImageUploadResult {
  originalUrl: string    // 원본 이미지 URL
  compressedUrl: string  // 압축 이미지 URL
}

/**
 * 이미지 URL에서 이미지를 다운로드하여 Buffer로 반환
 *
 * @param imageUrl - 이미지 URL
 * @returns 이미지 Buffer
 */
export async function fetchImageAsBuffer(imageUrl: string): Promise<Buffer> {
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`)
  }
  return Buffer.from(await response.arrayBuffer())
}

/**
 * 이미지를 WebP로 압축
 *
 * @param buffer - 이미지 Buffer
 * @param options - 압축 옵션
 * @returns 압축된 WebP Buffer
 */
export async function compressToWebp(
  buffer: Buffer,
  options: CompressOptions = {}
): Promise<Buffer> {
  const { quality = 85 } = options

  return sharp(buffer)
    .webp({ quality })
    .toBuffer()
}

/** 리사이징 및 압축 옵션 */
interface ResizeAndCompressOptions {
  maxWidth?: number   // 최대 너비 (기본: 400)
  maxHeight?: number  // 최대 높이 (기본: 600)
  quality?: number    // WebP 품질 (0-100, 기본: 85)
}

/**
 * 이미지를 리사이징하고 WebP로 압축
 *
 * @param buffer - 이미지 Buffer
 * @param options - 리사이징 및 압축 옵션
 * @returns 리사이징 및 압축된 WebP Buffer
 */
export async function resizeAndCompressToWebp(
  buffer: Buffer,
  options: ResizeAndCompressOptions = {}
): Promise<Buffer> {
  const { maxWidth = 400, maxHeight = 600, quality = 85 } = options

  return sharp(buffer)
    .resize(maxWidth, maxHeight, {
      fit: 'inside',           // 비율 유지하며 맞추기
      withoutEnlargement: true // 원본보다 크게 확대하지 않음
    })
    .webp({ quality })
    .toBuffer()
}

/**
 * 이미지를 PNG로 변환 (원본 보존용)
 *
 * @param buffer - 이미지 Buffer
 * @returns PNG Buffer
 */
export async function convertToPng(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .png()
    .toBuffer()
}

/**
 * 외부 URL 이미지를 R2에 원본/압축본으로 저장 (병렬 업로드)
 *
 * @param imageUrl - 원본 이미지 URL
 * @param folder - R2 저장 폴더 (예: 'image-ads', 'video-ads')
 * @param id - 고유 식별자 (예: image ad ID)
 * @param options - 압축 옵션
 * @returns 원본 및 압축 이미지 URL
 */
export async function uploadExternalImageToR2(
  imageUrl: string,
  folder: string,
  id: string,
  options: CompressOptions = {}
): Promise<ImageUploadResult> {
  const timestamp = Date.now()

  // 1. 이미지 다운로드
  const imageBuffer = await fetchImageAsBuffer(imageUrl)

  // 2. 이미지 변환 병렬 처리
  const [pngBuffer, webpBuffer] = await Promise.all([
    convertToPng(imageBuffer),
    compressToWebp(imageBuffer, options),
  ])

  // 3. R2 업로드 병렬 처리
  const originalKey = `${folder}/original/${id}_${timestamp}.png`
  const compressedKey = `${folder}/compressed/${id}_${timestamp}.webp`

  const [originalUrl, compressedUrl] = await Promise.all([
    uploadBufferToR2(pngBuffer, originalKey, 'image/png'),
    uploadBufferToR2(webpBuffer, compressedKey, 'image/webp'),
  ])

  return {
    originalUrl,
    compressedUrl,
  }
}

/**
 * Buffer 이미지를 R2에 원본/압축본으로 저장 (병렬 업로드)
 *
 * @param buffer - 이미지 Buffer
 * @param folder - R2 저장 폴더
 * @param id - 고유 식별자
 * @param options - 압축 옵션
 * @returns 원본 및 압축 이미지 URL
 */
export async function uploadBufferImageToR2(
  buffer: Buffer,
  folder: string,
  id: string,
  options: CompressOptions = {}
): Promise<ImageUploadResult> {
  const timestamp = Date.now()

  // 1. 이미지 변환 병렬 처리
  const [pngBuffer, webpBuffer] = await Promise.all([
    convertToPng(buffer),
    compressToWebp(buffer, options),
  ])

  // 2. R2 업로드 병렬 처리
  const originalKey = `${folder}/original/${id}_${timestamp}.png`
  const compressedKey = `${folder}/compressed/${id}_${timestamp}.webp`

  const [originalUrl, compressedUrl] = await Promise.all([
    uploadBufferToR2(pngBuffer, originalKey, 'image/png'),
    uploadBufferToR2(webpBuffer, compressedKey, 'image/webp'),
  ])

  return {
    originalUrl,
    compressedUrl,
  }
}
