/**
 * Gemini 프롬프트 개선 검증 스크립트
 *
 * 사용법: npx tsx scripts/test-prompt-improvements.ts
 */

// Phase 1 검증 체크리스트
const PHASE1_CHECKS = {
  videoPrompt: {
    // BAD 표현 (출력에 없어야 함)
    forbidden: [
      'big smile', 'wide grin', 'teeth showing', 'beaming',
      'excited expression', 'overly cheerful', 'enthusiastic',
      'softbox', 'ring light', 'LED panel', 'lighting rig',
      'studio light', 'reflector panel'
    ],
    // GOOD 표현 (출력에 있어야 함 - 일부)
    expected: [
      /gentle|soft|natural|relaxed|subtle|candid/i,
      /light from|daylight|golden hour|ambient/i,
      /lens|f\/\d/i, // 카메라 스펙
    ]
  },
  scenario: {
    // BAD 씬 제목 (출력에 없어야 함)
    forbiddenTitles: ['시작', '소개', '끝', '마무리', '중간'],
    // 구조 검증
    structure: {
      scenariosCount: 3,
      minScenesPerScenario: 1,
      maxScenesPerScenario: 8,
    }
  }
}

/**
 * 프롬프트 출력 검증 함수
 */
function validatePromptOutput(output: string, checks: typeof PHASE1_CHECKS.videoPrompt) {
  const results: { check: string; passed: boolean; detail?: string }[] = []

  // 금지 표현 체크
  for (const forbidden of checks.forbidden) {
    const found = output.toLowerCase().includes(forbidden.toLowerCase())
    results.push({
      check: `No "${forbidden}"`,
      passed: !found,
      detail: found ? `Found: "${forbidden}"` : undefined
    })
  }

  // 기대 표현 체크
  for (const pattern of checks.expected) {
    const found = pattern.test(output)
    results.push({
      check: `Has pattern: ${pattern}`,
      passed: found,
      detail: found ? 'Found' : 'Not found'
    })
  }

  return results
}

/**
 * 시나리오 출력 검증 함수
 */
function validateScenarioOutput(
  scenarios: Array<{ title: string; scenes: Array<{ title: string; duration: number }> }>,
  checks: typeof PHASE1_CHECKS.scenario
) {
  const results: { check: string; passed: boolean; detail?: string }[] = []

  // 시나리오 개수 체크
  results.push({
    check: `Scenario count = ${checks.structure.scenariosCount}`,
    passed: scenarios.length === checks.structure.scenariosCount,
    detail: `Actual: ${scenarios.length}`
  })

  // 각 시나리오 검증
  scenarios.forEach((scenario, i) => {
    // 씬 개수 체크
    const sceneCount = scenario.scenes.length
    results.push({
      check: `Scenario ${i + 1}: scene count in range`,
      passed: sceneCount >= checks.structure.minScenesPerScenario &&
        sceneCount <= checks.structure.maxScenesPerScenario,
      detail: `Actual: ${sceneCount}`
    })

    // 금지 제목 체크
    for (const scene of scenario.scenes) {
      const isForbidden = checks.forbiddenTitles.includes(scene.title)
      if (isForbidden) {
        results.push({
          check: `Scenario ${i + 1}: No generic titles`,
          passed: false,
          detail: `Found generic title: "${scene.title}"`
        })
      }
    }
  })

  return results
}

// 출력 예시
console.log('=== Phase 1 검증 체크리스트 ===\n')

console.log('video-prompt.ts 검증:')
console.log('- BAD 표현 검사:', PHASE1_CHECKS.videoPrompt.forbidden.length, '개')
console.log('- GOOD 패턴 검사:', PHASE1_CHECKS.videoPrompt.expected.length, '개')

console.log('\nscenario.ts 검증:')
console.log('- 금지 제목:', PHASE1_CHECKS.scenario.forbiddenTitles)
console.log('- 구조 요구사항:', PHASE1_CHECKS.scenario.structure)

console.log('\n실제 테스트를 위해서는 API 엔드포인트를 호출하거나')
console.log('Gemini 함수를 직접 호출해서 출력을 검증하세요.')

export { validatePromptOutput, validateScenarioOutput, PHASE1_CHECKS }
