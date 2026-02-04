import { prisma } from '@/lib/db'
import { IMAGE_AD_CREDIT_COST, type ImageQuality } from './constants'

/**
 * 사용자 크레딧 조회
 */
export async function getUserCredits(userId: string): Promise<number> {
  const profile = await prisma.profiles.findUnique({
    where: { id: userId },
    select: { credits: true },
  })
  return profile?.credits ?? 0
}

/**
 * 크레딧 충분 여부 확인
 */
export async function hasEnoughCredits(
  userId: string,
  requiredCredits: number
): Promise<boolean> {
  const credits = await getUserCredits(userId)
  return credits >= requiredCredits
}

/**
 * 크레딧 차감 (Prisma 트랜잭션 클라이언트 사용)
 */
export async function deductCredits(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  userId: string,
  amount: number
): Promise<void> {
  await tx.profiles.update({
    where: { id: userId },
    data: { credits: { decrement: amount } },
  })
}

/**
 * 크레딧 환불
 */
export async function refundCredits(
  userId: string,
  amount: number
): Promise<void> {
  await prisma.profiles.update({
    where: { id: userId },
    data: { credits: { increment: amount } },
  })
}

/**
 * 이미지 광고 크레딧 계산
 */
export function calculateImageAdCredits(
  quality: ImageQuality,
  numImages: number = 1
): number {
  return IMAGE_AD_CREDIT_COST[quality] * numImages
}

/**
 * 크레딧 검증 결과 타입
 */
export interface CreditValidationResult {
  isValid: boolean
  currentCredits: number
  requiredCredits: number
}

/**
 * 크레딧 충분 여부 검증
 */
export async function validateCredits(
  userId: string,
  requiredCredits: number
): Promise<CreditValidationResult> {
  const currentCredits = await getUserCredits(userId)
  const isValid = currentCredits >= requiredCredits

  return {
    isValid,
    currentCredits,
    requiredCredits,
  }
}
