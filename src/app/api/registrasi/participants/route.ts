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

  if (!profile || !['super_admin', 'admin', 'official'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { nama, tim, tahun_lahir, gender, event_id, kategori_id } = body

  if (!nama || !event_id) {
    return NextResponse.json({ error: 'Nama atlet dan event wajib diisi' }, { status: 400 })
  }

  // Find or create team
  let teamId: string | null = null
  if (tim) {
    const { data: existingTeam } = await supabase
      .from('teams')
      .select('id')
      .eq('nama', tim)
      .eq('event_id', event_id)
      .single()

    if (existingTeam) {
      teamId = existingTeam.id
    } else {
      const { data: newTeam } = await supabase
        .from('teams')
        .insert({ nama: tim, event_id })
        .select('id')
        .single()
      teamId = newTeam?.id ?? null
    }
  }

  const { data: participant, error } = await supabase
    .from('participants')
    .insert({
      nama,
      team_id: teamId,
      tahun_lahir: tahun_lahir ? Number(tahun_lahir) : null,
      gender,
      event_category_id: kategori_id || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(participant)
}