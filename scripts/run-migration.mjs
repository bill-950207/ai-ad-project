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
const connectionString = process.env.DIRECT_URL ||
  'postgresql://postgres.ilwhkpoxzxokfmzvpkof:jocoding123!@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres'

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
