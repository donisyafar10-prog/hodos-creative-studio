import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = cookies()
  const supabase = createServerClient({
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try { cookieStore.set({ name, value, ...options }) } catch {}
      },
      remove(name: string, options: any) {
        try { cookieStore.set({ name, value: '', ...options }) } catch {}
      },
    },
  })

  await supabase.auth.signOut()
  return NextResponse.json({ success: true })
}
