import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
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

  if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { nama, tanggal, lokasi } = body

  if (!nama || !tanggal) {
    return NextResponse.json({ error: 'Nama dan tanggal wajib diisi' }, { status: 400 })
  }

  const { data: event, error } = await supabase
    .from('events')
    .insert({
      nama,
      tanggal,
      lokasi,
      status: 'draft',
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(event)
}