#!/usr/bin/env node

/**
 * 배포 후 검색엔진에 새/변경된 URL을 자동 알림
 *
 * 1. Google sitemap ping — sitemap 갱신 알림
 * 2. IndexNow — Naver, Bing, Yandex에 URL 목록 제출
 *
 * 사용법:
 *   node scripts/notify-search-engines.mjs          # 전체 URL 제출
 *   node scripts/notify-search-engines.mjs --dry    # 실제 요청 없이 URL 목록만 출력
 */

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://gwanggo.jocoding.io'
const INDEXNOW_KEY = '5f2512700708f915d3bcf5f30d088115'

const isDryRun = process.argv.includes('--dry')

// ============================================================
// 제출할 URL 목록 생성
// ============================================================

const locales = ['ko', 'en', 'ja', 'zh']
const imageModels = ['seedream-5', 'flux-2-pro', 'grok-imagine', 'z-image']
const videoModels = ['seedance', 'vidu-q3', 'kling-3', 'grok-video', 'wan-26']

function getAllUrls() {
  const urls = []

  // 랜딩 페이지
  for (const locale of locales) {
    urls.push(`${SITE_URL}/${locale}`)
  }

  // 도구 개요 페이지
  for (const locale of locales) {
    urls.push(`${SITE_URL}/${locale}/tools/image`)
    urls.push(`${SITE_URL}/${locale}/tools/video`)
  }

  // 모델별 상세 페이지
  for (const locale of locales) {
    for (const model of imageModels) {
      urls.push(`${SITE_URL}/${locale}/tools/image/${model}`)
    }
    for (const model of videoModels) {
      urls.push(`${SITE_URL}/${locale}/tools/video/${model}`)
    }
  }

  // 대시보드 AI 도구 (SEO 페이지)
  for (const locale of locales) {
    urls.push(`${SITE_URL}/dashboard/ai-tools/${locale}/image`)
    urls.push(`${SITE_URL}/dashboard/ai-tools/${locale}/video`)
  }

  // 기타
  urls.push(`${SITE_URL}/pricing`)

  return urls
}

// ============================================================
// Google Sitemap Ping
// ============================================================

async function pingGoogle() {
  const sitemapUrl = `${SITE_URL}/sitemap.xml`
  const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`

  console.log(`[Google] Pinging sitemap: ${sitemapUrl}`)

  if (isDryRun) {
    console.log(`[Google] (dry run) Would GET ${pingUrl}`)
    return
  }

  try {
    const res = await fetch(pingUrl)
    console.log(`[Google] Response: ${res.status} ${res.statusText}`)
  } catch (err) {
    console.error(`[Google] Error: ${err.message}`)
  }
}

// ============================================================
// IndexNow (Naver, Bing, Yandex)
// ============================================================

async function submitIndexNow(urls) {
  // IndexNow는 하나의 엔진에만 제출하면 다른 엔진에도 공유됨
  // api.indexnow.org가 공통 엔드포인트
  const endpoint = 'https://api.indexnow.org/indexnow'

  const payload = {
    host: new URL(SITE_URL).hostname,
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: urls,
  }

  console.log(`\n[IndexNow] Submitting ${urls.length} URLs to ${endpoint}`)

  if (isDryRun) {
    console.log(`[IndexNow] (dry run) Would POST:`)
    console.log(JSON.stringify(payload, null, 2).slice(0, 500) + '...')
    return
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    })
    console.log(`[IndexNow] Response: ${res.status} ${res.statusText}`)
    if (!res.ok) {
      const text = await res.text()
      console.error(`[IndexNow] Error body: ${text}`)
    }
  } catch (err) {
    console.error(`[IndexNow] Error: ${err.message}`)
  }
}

// ============================================================
// 메인 실행
// ============================================================

async function main() {
  console.log('=== Search Engine Notification ===')
  console.log(`Site: ${SITE_URL}`)
  if (isDryRun) console.log('(DRY RUN MODE)')
  console.log('')

  const urls = getAllUrls()
  console.log(`Total URLs: ${urls.length}`)

  // Google sitemap ping
  await pingGoogle()

  // IndexNow (Naver, Bing, Yandex)
  await submitIndexNow(urls)

  console.log('\n=== Done ===')
}

main().catch(console.error)
