/**
 * Supabase Admin 클라이언트
 *
 * 서버 간 통신 (콜백 등)에서 사용하는 Supabase 클라이언트입니다.
 * Service Role Key를 사용하여 RLS를 우회합니다.
 */

import { createClient } from '@supabase/supabase-js'

/**
 * Admin용 Supabase 클라이언트 생성
 *
 * 콜백이나 서버 간 통신에서 사용합니다.
 * Service Role Key를 사용하므로 RLS가 적용되지 않습니다.
 *
 * @returns Supabase admin 클라이언트 인스턴스
 */
export function createAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
