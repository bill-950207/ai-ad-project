/**
 * SQL 마이그레이션 실행 스크립트
 *
 * 사용법: node scripts/run-migration.mjs
 */

import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 환경변수에서 직접 연결 URL 사용 (pooler가 아닌 direct connection)
// ⚠️ DIRECT_URL 환경변수 필수 - 하드코딩 금지
const connectionString = process.env.DIRECT_URL

if (!connectionString) {
  console.error('❌ 오류: DIRECT_URL 환경변수가 설정되지 않았습니다.')
  console.error('   .env 파일에 DIRECT_URL을 설정하거나 환경변수로 전달해주세요.')
  console.error('   예: DIRECT_URL="postgresql://..." node scripts/run-migration.mjs')
  process.exit(1)
}

async function runMigration() {
  const client = new pg.Client({ connectionString })

  try {
    await client.connect()
    console.log('데이터베이스 연결 성공')

    // 명령줄 인자에서 SQL 파일 경로 받기
    const sqlFile = process.argv[2]
    let sqlPath

    if (sqlFile) {
      // 상대 경로 또는 절대 경로 처리
      sqlPath = path.isAbsolute(sqlFile) ? sqlFile : path.join(process.cwd(), sqlFile)
    } else {
      // 기본 파일
      sqlPath = path.join(__dirname, '../prisma/migrations/add_avatar_outfits.sql')
    }

    console.log('마이그레이션 파일:', sqlPath)
    const sql = fs.readFileSync(sqlPath, 'utf-8')

    // SQL 실행
    await client.query(sql)
    console.log('마이그레이션 성공!')

  } catch (error) {
    console.error('마이그레이션 실패:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

runMigration()
