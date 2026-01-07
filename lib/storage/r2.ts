import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

interface UploadImageOptions {
  imageUrl: string
  fileName: string
  folder?: string
}

/**
 * Downloads an image from a URL and uploads it to R2
 * Returns the public URL of the uploaded image
 */
export async function uploadImageToR2({
  imageUrl,
  fileName,
  folder = 'avatars',
}: UploadImageOptions): Promise<string> {
  // Download the image from the source URL
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`)
  }

  const contentType = response.headers.get('content-type') || 'image/png'
  const imageBuffer = await response.arrayBuffer()

  // Generate the R2 key (path)
  const key = `${folder}/${fileName}`

  // Upload to R2
  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: Buffer.from(imageBuffer),
      ContentType: contentType,
    })
  )

  // Return the public URL
  return `${R2_PUBLIC_URL}/${key}`
}

/**
 * Generate a unique filename for avatar images
 */
export function generateAvatarFileName(avatarId: string, extension: string = 'png'): string {
  const timestamp = Date.now()
  return `${avatarId}_${timestamp}.${extension}`
}
