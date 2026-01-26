/**
 * 데이터베이스 시드 스크립트
 *
 * 실행: npm run db:seed
 */

import 'dotenv/config'
import { PrismaClient, plan_type } from '../lib/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

// 데이터베이스 연결 설정
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL

if (!connectionString) {
  console.error('Error: DATABASE_URL or DIRECT_URL environment variable is required')
  process.exit(1)
}

const pool = new pg.Pool({
  connectionString,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // 플랜 시드 데이터
  const plans = [
    {
      name: plan_type.FREE,
      display_name: 'Free',
      price_monthly: 0,
      price_yearly: 0,
      avatar_limit: 3,
      music_limit: 5,
      product_limit: 3,
      monthly_credits: 0,
      keyframe_count: 1,
      watermark_free: false,
      hd_upscale: false,
    },
    {
      name: plan_type.STARTER,
      display_name: 'Starter',
      price_monthly: 999, // $9.99
      price_yearly: 9990, // $99.90 (2개월 무료)
      avatar_limit: 9,
      music_limit: 15,
      product_limit: 9,
      monthly_credits: 50,
      keyframe_count: 2,
      watermark_free: false,
      hd_upscale: true,
    },
    {
      name: plan_type.PRO,
      display_name: 'Pro',
      price_monthly: 2999, // $29.99
      price_yearly: 29990, // $299.90 (2개월 무료)
      avatar_limit: 30,
      music_limit: 50,
      product_limit: 30,
      monthly_credits: 300, // ~150 이미지 or ~30 영상
      keyframe_count: 2,
      watermark_free: true,
      hd_upscale: true,
    },
    {
      name: plan_type.BUSINESS,
      display_name: 'Business',
      price_monthly: 9999, // $99.99
      price_yearly: 99990, // $999.90 (2개월 무료)
      avatar_limit: -1, // 무제한
      music_limit: -1,
      product_limit: -1,
      monthly_credits: 1000, // ~500 이미지 or ~100 영상
      keyframe_count: 2,
      watermark_free: true,
      hd_upscale: true,
    },
  ]

  // 플랜 upsert (기존 데이터가 있으면 업데이트)
  for (const plan of plans) {
    await prisma.plans.upsert({
      where: { name: plan.name },
      update: {
        display_name: plan.display_name,
        price_monthly: plan.price_monthly,
        price_yearly: plan.price_yearly,
        avatar_limit: plan.avatar_limit,
        music_limit: plan.music_limit,
        product_limit: plan.product_limit,
        monthly_credits: plan.monthly_credits,
        keyframe_count: plan.keyframe_count,
        watermark_free: plan.watermark_free,
        hd_upscale: plan.hd_upscale,
      },
      create: plan,
    })
    console.log(`  - Plan "${plan.display_name}" upserted`)
  }

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
