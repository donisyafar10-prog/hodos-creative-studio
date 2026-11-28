import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

async function getAuthorizedProfile(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['super_admin', 'admin', 'official'].includes(profile.role)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { profile }
}

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

  const auth = await getAuthorizedProfile(supabase)
  if ('error' in auth) return auth.error

  const body = await req.json()
  const { nama, tim, tahun_lahir, gender, event_id, kategori_id, team_id } = body

  if (!nama || !event_id) {
    return NextResponse.json({ error: 'Nama atlet dan event wajib diisi' }, { status: 400 })
  }

  // Tentukan team_id: dari team_id langsung, atau cari/buat berdasarkan nama tim
  let resolvedTeamId: string | null = team_id || null
  if (!resolvedTeamId && tim) {
    const { data: existingTeam } = await supabase
      .from('teams')
      .select('id')
      .eq('nama', tim)
      .eq('event_id', event_id)
      .single()

    if (existingTeam) {
      resolvedTeamId = existingTeam.id
    } else {
      const { data: newTeam } = await supabase
        .from('teams')
        .insert({ nama: tim, event_id })
        .select('id')
        .single()
      resolvedTeamId = newTeam?.id ?? null
    }
  }

  const { data: participant, error } = await supabase
    .from('participants')
    .insert({
      nama,
      team_id: resolvedTeamId,
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

  const auth = await getAuthorizedProfile(supabase)
  if ('error' in auth) return auth.error

  // Ambil category IDs untuk event ini dulu
  const { data: categories } = await supabase
    .from('event_categories')
    .select('id')
    .eq('event_id', eventId)

  const categoryIds = (categories ?? []).map((c: any) => c.id)

  let query = supabase
    .from('participants')
    .select('id, nama, team_id, tahun_lahir, gender, event_category_id, teams(nama)')
    .order('nama', { ascending: true })

  if (categoryIds.length > 0) {
    query = query.in('event_category_id', categoryIds)
  } else {
    query = query.is('event_category_id', null)
  }

  const { data: participants, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const result = (participants ?? []).map((p: any) => ({
    id: p.id,
    nama: p.nama,
    team_nama: p?.teams?.nama ?? null,
    tahun_lahir: p.tahun_lahir ?? null,
    gender: p.gender ?? null,
    event_category_id: p.event_category_id,
  }))

  return NextResponse.json(result)
}