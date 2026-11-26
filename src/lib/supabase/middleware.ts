// This file is no longer needed as middleware.ts handles its own client creation
// Keeping for potential future use

import { createServerClient as createSupabaseServerClient, type CookieOptions } from '@supabase/ssr'

export function createMiddlewareClient() {
  return createSupabaseServerClient
}