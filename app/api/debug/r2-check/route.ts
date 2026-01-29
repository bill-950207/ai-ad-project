import { NextResponse } from 'next/server'

export async function GET() {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucketName = process.env.R2_BUCKET_NAME
  const publicUrl = process.env.R2_PUBLIC_URL

  return NextResponse.json({
    exists: {
      R2_ACCOUNT_ID: !!accountId,
      R2_ACCESS_KEY_ID: !!accessKeyId,
      R2_SECRET_ACCESS_KEY: !!secretAccessKey,
      R2_BUCKET_NAME: !!bucketName,
      R2_PUBLIC_URL: !!publicUrl,
    },
    lengths: {
      accountId: accountId?.trim().length ?? 0,
      accessKeyId: accessKeyId?.trim().length ?? 0,
      secretAccessKey: secretAccessKey?.trim().length ?? 0,
      bucketName: bucketName?.trim().length ?? 0,
      publicUrl: publicUrl?.trim().length ?? 0,
    },
    // 첫 4자만 표시 (디버깅용)
    preview: {
      accountId: accountId?.substring(0, 4) + '...',
      accessKeyId: accessKeyId?.substring(0, 4) + '...',
      bucketName: bucketName?.substring(0, 4) + '...',
    },
  })
}
