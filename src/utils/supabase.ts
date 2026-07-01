import { createClient } from '@supabase/supabase-js'

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : (typeof globalThis.process !== 'undefined' ? globalThis.process.env : {});
const supabaseUrl = env.VITE_PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL
const supabaseAnonKey = env.VITE_PUBLIC_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
    storageKey: 'syngh-auth-session',
  },
})
