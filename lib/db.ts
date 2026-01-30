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
 * pg.Pool을 사용하여 데이터베이스 연결을 설정합니다.
 * 런타임에서는 DATABASE_URL (pgbouncer)을 사용하여 연결 풀링을 활용합니다.
 */
function createPrismaClient() {
  // DATABASE_URL (pgbouncer 풀러) 우선 사용 - 런타임 연결 풀링
  // DIRECT_URL은 마이그레이션/시딩 전용 (Supabase 직접 연결 제한: Free 2개, Pro 15개)
  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL

  // PostgreSQL 연결 풀 생성
  // pgbouncer 사용 시 max를 낮게 유지 (pgbouncer가 풀링 담당)
  const pool = new pg.Pool({
    connectionString,
    max: 5,                        // pgbouncer 사용 시 낮게 설정
    idleTimeoutMillis: 10000,      // 유휴 연결 타임아웃 (10초)
    connectionTimeoutMillis: 5000, // 연결 타임아웃 (5초)
  })

  // Prisma용 pg 어댑터 생성
  const adapter = new PrismaPg(pool)

  // Prisma 클라이언트 반환
  return new PrismaClient({
    adapter,
    // 쿼리 로그는 성능에 영향을 주므로 에러만 출력
    log: ['error'],
  })
}

// Prisma 클라이언트 싱글톤 인스턴스
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// 개발 환경에서 전역 객체에 클라이언트 저장 (핫 리로드 시 재사용)
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
