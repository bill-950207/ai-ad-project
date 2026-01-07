import { createBrowserClient } from '@supabase/ssr'

let supabaseUrl: string | null = null
let supabaseAnonKey: string | null = null

export function setSupabaseConfig(url: string, anonKey: string) {
  supabaseUrl = url
  supabaseAnonKey = anonKey
}

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase config not initialized. Call setSupabaseConfig first.')
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
