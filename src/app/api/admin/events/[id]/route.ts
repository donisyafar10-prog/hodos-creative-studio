import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
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
  const { status } = body

  if (!status || !['draft', 'published', 'ongoing', 'finished'].includes(status)) {
    return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 })
  }

  const { error } = await supabase
    .from('events')
    .update({ status })
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}