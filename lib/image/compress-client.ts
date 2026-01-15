/**
 * 클라이언트 사이드 이미지 압축 유틸리티
 *
 * 브라우저 Canvas API를 사용하여 이미지를 압축합니다.
 * 서버 사이드 압축은 compress.ts를 사용하세요.
 */

/** 클라이언트 압축 옵션 */
interface ClientCompressOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number  // 0-1
}

/**
 * 클라이언트 사이드 이미지 압축 (Canvas 사용)
 *
 * @param file - 원본 이미지 파일
 * @param options - 압축 옵션
 * @returns 압축된 이미지 파일
 */
export async function compressImage(
  file: File,
  options: ClientCompressOptions = {}
): Promise<File> {
  const { maxWidth = 1024, maxHeight = 1024, quality = 0.8 } = options

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // 원본 크기
      let { width, height } = img

      // 최대 크기에 맞게 비율 조정
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      canvas.width = width
      canvas.height = height

      // 이미지 그리기
      ctx?.drawImage(img, 0, 0, width, height)

      // Blob으로 변환
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // 원본 파일 확장자 유지 또는 jpeg로 변경
            const extension = file.type === 'image/png' ? 'png' : 'jpeg'
            const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
            const fileName = file.name.replace(/\.[^/.]+$/, `.${extension}`)

            const compressedFile = new File([blob], fileName, {
              type: mimeType,
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          } else {
            reject(new Error('이미지 압축 실패'))
          }
        },
        file.type === 'image/png' ? 'image/png' : 'image/jpeg',
        quality
      )

      // URL 해제
      URL.revokeObjectURL(img.src)
    }

    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      reject(new Error('이미지 로드 실패'))
    }

    img.src = URL.createObjectURL(file)
  })
}
