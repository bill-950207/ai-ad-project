/**
 * 크레딧 히스토리 유틸리티
 *
 * 크레딧 사용/획득 이력을 기록하는 함수들
 */

import { prisma } from '@/lib/db'
import {
  credit_transaction_type,
  credit_feature_type,
} from '@/lib/generated/prisma/client'
import type { Prisma } from '@/lib/generated/prisma/client'

// 트랜잭션 클라이언트 타입
type TransactionClient = Omit<
  typeof prisma,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

interface RecordCreditHistoryParams {
  userId: string
  transactionType: credit_transaction_type
  featureType?: credit_feature_type
  amount: number  // 양수: 획득, 음수: 사용
  balanceAfter: number
  relatedEntityId?: string
  description?: string
}

/**
 * 크레딧 히스토리 기록
 *
 * @param params - 히스토리 기록 파라미터
 * @param tx - 트랜잭션 클라이언트 (선택, 트랜잭션 내에서 호출 시 사용)
 */
export async function recordCreditHistory(
  params: RecordCreditHistoryParams,
  tx?: TransactionClient
): Promise<void> {
  const client = tx || prisma

  await client.credit_history.create({
    data: {
      user_id: params.userId,
      transaction_type: params.transactionType,
      feature_type: params.featureType,
      amount: params.amount,
      balance_after: params.balanceAfter,
      related_entity_id: params.relatedEntityId,
      description: params.description,
    },
  })
}

/**
 * 크레딧 사용 기록 (USE)
 */
export async function recordCreditUse(
  params: {
    userId: string
    featureType: credit_feature_type
    amount: number  // 양수로 입력 (내부에서 음수 변환)
    balanceAfter: number
    relatedEntityId?: string
    description?: string
  },
  tx?: TransactionClient
): Promise<void> {
  await recordCreditHistory(
    {
      userId: params.userId,
      transactionType: 'USE',
      featureType: params.featureType,
      amount: -Math.abs(params.amount),  // 항상 음수
      balanceAfter: params.balanceAfter,
      relatedEntityId: params.relatedEntityId,
      description: params.description,
    },
    tx
  )
}

/**
 * 크레딧 환불 기록 (REFUND)
 */
export async function recordCreditRefund(
  params: {
    userId: string
    featureType: credit_feature_type
    amount: number  // 양수로 입력
    balanceAfter: number
    relatedEntityId?: string
    description?: string
  },
  tx?: TransactionClient
): Promise<void> {
  await recordCreditHistory(
    {
      userId: params.userId,
      transactionType: 'REFUND',
      featureType: params.featureType,
      amount: Math.abs(params.amount),  // 항상 양수
      balanceAfter: params.balanceAfter,
      relatedEntityId: params.relatedEntityId,
      description: params.description,
    },
    tx
  )
}

/**
 * 구독 크레딧 지급 기록 (SUBSCRIPTION)
 */
export async function recordSubscriptionCredit(
  params: {
    userId: string
    amount: number
    balanceAfter: number
    description?: string
  },
  tx?: TransactionClient
): Promise<void> {
  await recordCreditHistory(
    {
      userId: params.userId,
      transactionType: 'SUBSCRIPTION',
      amount: Math.abs(params.amount),
      balanceAfter: params.balanceAfter,
      description: params.description || '월간 구독 크레딧 지급',
    },
    tx
  )
}

/**
 * 가입 크레딧 지급 기록 (SIGNUP)
 */
export async function recordSignupCredit(
  params: {
    userId: string
    amount: number
    balanceAfter: number
  },
  tx?: TransactionClient
): Promise<void> {
  await recordCreditHistory(
    {
      userId: params.userId,
      transactionType: 'SIGNUP',
      amount: Math.abs(params.amount),
      balanceAfter: params.balanceAfter,
      description: '회원가입 크레딧 지급',
    },
    tx
  )
}

/**
 * 관리자 크레딧 조정 기록 (ADMIN)
 */
export async function recordAdminAdjustment(
  params: {
    userId: string
    amount: number  // 양수: 추가, 음수: 차감
    balanceAfter: number
    description?: string
  },
  tx?: TransactionClient
): Promise<void> {
  await recordCreditHistory(
    {
      userId: params.userId,
      transactionType: 'ADMIN',
      amount: params.amount,
      balanceAfter: params.balanceAfter,
      description: params.description || '관리자 크레딧 조정',
    },
    tx
  )
}

// Re-export types for convenience
export { credit_transaction_type, credit_feature_type }
