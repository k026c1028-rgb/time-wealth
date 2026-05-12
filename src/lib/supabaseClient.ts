import { createClient } from '@supabase/supabase-js'

// Read from Vite env. User will put these into .env.local
const url = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined
const anonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabaseEnabled = Boolean(url && anonKey)

export const supabase = supabaseEnabled
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null

