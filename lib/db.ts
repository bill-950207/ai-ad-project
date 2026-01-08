/**
 * Prisma 데이터베이스 클라이언트
 *
 * PostgreSQL 데이터베이스 연결을 위한 Prisma 클라이언트를 설정합니다.
 * Supabase와 호환되도록 pg 어댑터를 사용합니다.
 */

import { PrismaClient } from './generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

// 전역 객체에 Prisma 클라이언트 타입 정의
// 개발 환경에서 핫 리로드 시 연결 재생성 방지
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Prisma 클라이언트 생성 함수
 *
 * pg.Pool을 사용하여 직접 데이터베이스 연결을 설정합니다.
 * Supabase pooler URL은 pg.Pool과 호환되지 않으므로 DIRECT_URL 사용을 권장합니다.
 */
function createPrismaClient() {
  // DIRECT_URL 우선 사용 (pooler URL은 직접 연결에서 작동하지 않음)
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL

  // PostgreSQL 연결 풀 생성
  const pool = new pg.Pool({
    connectionString,
  })

  // Prisma용 pg 어댑터 생성
  const adapter = new PrismaPg(pool)

  // Prisma 클라이언트 반환
  return new PrismaClient({
    adapter,
    // 개발 환경에서는 쿼리, 에러, 경고 로그 출력
    // 프로덕션에서는 에러만 출력
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

// Prisma 클라이언트 싱글톤 인스턴스
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// 개발 환경에서 전역 객체에 클라이언트 저장 (핫 리로드 시 재사용)
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
