import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('event_id')

  if (!eventId) {
    return NextResponse.json({ error: 'event_id wajib diisi' }, { status: 400 })
  }

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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['super_admin', 'admin', 'official'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: categories, error } = await supabase
    .from('event_categories')
    .select('id, nomor_acara, gaya, jenis_kelamin, sesi, urutan')
    .eq('event_id', eventId)
    .order('urutan', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(categories ?? [])
}
