/**
 * Supabase 브라우저 클라이언트
 *
 * 클라이언트 사이드 (브라우저)에서 사용하는 Supabase 클라이언트입니다.
 * 초기화 시 서버에서 전달받은 설정을 사용합니다.
 */

import { createBrowserClient } from '@supabase/ssr'

// Supabase 설정 (서버에서 초기화)
let supabaseUrl: string | null = null
let supabaseAnonKey: string | null = null

/**
 * Supabase 설정 초기화
 *
 * 서버에서 클라이언트로 Supabase 설정을 전달할 때 호출됩니다.
 * 보안을 위해 환경 변수를 직접 클라이언트에서 사용하지 않습니다.
 *
 * @param url - Supabase 프로젝트 URL
 * @param anonKey - Supabase 익명 키 (공개 가능)
 */
export function setSupabaseConfig(url: string, anonKey: string) {
  supabaseUrl = url
  supabaseAnonKey = anonKey
}

/**
 * 브라우저용 Supabase 클라이언트 생성
 *
 * 클라이언트 컴포넌트에서 Supabase에 접근할 때 사용합니다.
 *
 * @returns Supabase 브라우저 클라이언트 인스턴스
 * @throws 설정이 초기화되지 않은 경우 에러
 */
export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase config not initialized. Call setSupabaseConfig first.')
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
