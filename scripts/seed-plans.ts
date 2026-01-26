/**
 * Plans 테이블 시드 스크립트
 *
 * 실행: npx tsx scripts/seed-plans.ts
 */

import { config } from 'dotenv'
// .env 파일 로드
config({ path: '.env' })

import { PrismaClient, plan_type } from '../lib/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

// PrismaClient 생성 (lib/db.ts와 동일한 설정)
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL

const pool = new pg.Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const plans = [
  {
    name: plan_type.FREE,
    display_name: 'Free',
    price_monthly: 0,
    price_yearly: 0,
    avatar_limit: 3,
    music_limit: 5,
    product_limit: 3,
    monthly_credits: 15, // 가입 시 1회 지급
    keyframe_count: 1,
    watermark_free: false,
    hd_upscale: false,
  },
  {
    name: plan_type.STARTER,
    display_name: 'Starter',
    price_monthly: 999, // $9.99
    price_yearly: 9990, // $99.90 (10개월 가격)
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
    price_yearly: 29990, // $299.90
    avatar_limit: 30,
    music_limit: 50,
    product_limit: 30,
    monthly_credits: 200,
    keyframe_count: 2,
    watermark_free: true,
    hd_upscale: true,
  },
  {
    name: plan_type.BUSINESS,
    display_name: 'Business',
    price_monthly: 9999, // $99.99
    price_yearly: 99990, // $999.90
    avatar_limit: -1, // 무제한
    music_limit: -1,
    product_limit: -1,
    monthly_credits: 500,
    keyframe_count: 2,
    watermark_free: true,
    hd_upscale: true,
  },
]

async function seedPlans() {
  console.log('Seeding plans...')

  for (const plan of plans) {
    const result = await prisma.plans.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    })
    console.log(`  - ${result.display_name} plan: ${result.id}`)
  }

  console.log('Plans seeded successfully!')
}

seedPlans()
  .catch((error) => {
    console.error('Error seeding plans:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
