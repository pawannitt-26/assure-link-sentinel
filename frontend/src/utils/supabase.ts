// Preview-safe: do NOT reference import.meta at the top level — the preview
// sandbox parses this file as a plain script, which makes `import.meta` a
// SyntaxError. We read config from globals/window instead.

function readEnv(key: string): string {
  try {
    const g: any = typeof globalThis !== 'undefined' ? globalThis : {}
    if (g && g.__ENV__ && typeof g.__ENV__[key] === 'string') return g.__ENV__[key]
    if (typeof window !== 'undefined') {
      const w: any = window
      if (w.__ENV__ && typeof w.__ENV__[key] === 'string') return w.__ENV__[key]
    }
  } catch {
    // ignore
  }
  return ''
}

export const SUPABASE_URL = readEnv('VITE_SUPABASE_URL')
export const SUPABASE_ANON_KEY = readEnv('VITE_SUPABASE_ANON_KEY')

// Minimal stub — the frontend uses the REST API via axios, not the Supabase
// JS client directly in preview. Real builds can swap this for @supabase/supabase-js.
export const supabase = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
  isConfigured: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY),
}

export default supabase