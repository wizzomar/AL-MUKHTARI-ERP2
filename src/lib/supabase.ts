import { createClient } from '@supabase/supabase-js'

// Vite embeds VITE_* values at build time. Keep the public Supabase connection
// as a safe fallback so a missing Vercel Environment Variable cannot leave
// the deployed ERP stuck on the setup screen. Publishable keys are designed
// for browser use; never place a service_role/secret key here.
const env = (import.meta as ImportMeta & { env: { VITE_SUPABASE_URL?: string; VITE_SUPABASE_PUBLISHABLE_KEY?: string } }).env

const url = env.VITE_SUPABASE_URL?.trim() || 'https://jphvkbolpgqwuptpxfjk.supabase.co'
const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || 'sb_publishable_g_BGS5YHOh2R3hfN6pzUSQ_oUDmg6a7'

export const supabaseConfigured = Boolean(url && publishableKey)

export const supabase = supabaseConfigured
  ? createClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // Use PKCE for recovery links and let App.tsx exchange the callback code
        // exactly once. This avoids the SDK and app racing to consume the same URL.
        flowType: 'pkce',
        detectSessionInUrl: false,
      },
    })
  : null
