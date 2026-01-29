/**
 * 크레딧 Race Condition 테스트 스크립트
 *
 * 사용법:
 * 1. 테스트용 사용자의 크레딧을 5로 설정
 * 2. 동시에 10개의 아바타 생성 요청을 보냄
 * 3. 최종 크레딧이 음수가 아닌지 확인
 *
 * 실행: npx ts-node scripts/test-credit-race-condition.ts
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// 테스트용 인증 토큰 (실제 테스트 시 유효한 토큰으로 교체)
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || ''

async function createAvatarRequest() {
  const response = await fetch(`${API_BASE_URL}/api/avatars`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `sb-access-token=${AUTH_TOKEN}`,
    },
    body: JSON.stringify({
      name: `Test Avatar ${Date.now()}`,
      prompt: 'A professional Korean woman in business attire',
    }),
  })

  const data = await response.json()
  return { status: response.status, data }
}

async function runTest() {
  console.log('🧪 크레딧 Race Condition 테스트 시작\n')
  console.log('테스트 조건:')
  console.log('- 초기 크레딧: 5')
  console.log('- 아바타 생성 비용: 1 크레딧')
  console.log('- 동시 요청 수: 10개\n')

  // 동시에 10개 요청
  const promises = Array.from({ length: 10 }, () => createAvatarRequest())

  console.log('⏳ 10개 요청 동시 전송 중...\n')
  const results = await Promise.all(promises)

  // 결과 분석
  const success = results.filter(r => r.status === 201).length
  const insufficientCredits = results.filter(r => r.status === 402).length
  const errors = results.filter(r => r.status >= 500).length

  console.log('📊 결과:')
  console.log(`- 성공: ${success}개`)
  console.log(`- 크레딧 부족: ${insufficientCredits}개`)
  console.log(`- 서버 에러: ${errors}개\n`)

  // Race Condition 검증
  if (success <= 5 && insufficientCredits >= 5) {
    console.log('✅ Race Condition 방지 성공!')
    console.log('   크레딧 5개로 최대 5개의 아바타만 생성됨')
  } else if (success > 5) {
    console.log('❌ Race Condition 발생!')
    console.log(`   크레딧 5개인데 ${success}개 생성됨`)
  }

  // 상세 결과
  console.log('\n📝 상세 결과:')
  results.forEach((r, i) => {
    const statusEmoji = r.status === 201 ? '✅' : r.status === 402 ? '⚠️' : '❌'
    console.log(`${statusEmoji} 요청 ${i + 1}: ${r.status} - ${r.data.error || 'Success'}`)
  })
}

// 실행
runTest().catch(console.error)
