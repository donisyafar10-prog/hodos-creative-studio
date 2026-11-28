import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { makeBukuAcaraPdf } from '@/lib/pdf-helper'

const ALLOWED_ROLES = ['super_admin', 'admin', 'official']

async function getAuthorizedUser(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
    return { error: NextResponse.json({ error: 'Forbidden - download access restricted' }, { status: 403 }) }
  }

  return { user, profile }
}

export async function GET(
  req: Request,
  { params }: { params: { eventId: string } }
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

  const auth = await getAuthorizedUser(supabase)
  if ('error' in auth) return auth.error

  const { eventId } = params

  const { data: event, error: eError } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (eError || !event) {
    return NextResponse.json({ error: 'Event tidak ditemukan' }, { status: 404 })
  }

  const { data: categories } = await supabase
    .from('event_categories')
    .select('*')
    .eq('event_id', eventId)
    .order('urutan', { ascending: true })

  const { data: teams } = await supabase.from('teams').select('id, nama').eq('event_id', eventId)

  const participantsByCategory = new Map<string, Array<{ id: string; nama: string; tahun_lahir: number | null; team_nama: string | null }>>()
  for (const cat of categories ?? []) {
    const { data: participants } = await supabase
      .from('participants')
      .select('id, nama, tahun_lahir, team_id, teams(nama)')
      .eq('event_category_id', cat.id)
      .order('nama', { ascending: true })
    participantsByCategory.set(cat.id, (participants ?? []).map((p) => ({
      id: p.id,
      nama: p.nama,
      tahun_lahir: (p as any)?.tahun_lahir ?? null,
      team_nama: (p as any)?.teams?.nama ?? null,
    })))
  }

  const pdfBuffer = makeBukuAcaraPdf({
    event: { nama: event.nama, tanggal: event.tanggal, lokasi: event.lokasi },
    categories: (categories ?? []).map((c) => ({
      id: c.id,
      nomor_acara: c.nomor_acara,
      gaya: c.gaya,
      jenis_kelamin: c.jenis_kelamin,
      sesi: c.sesi,
      urutan: c.urutan,
    })),
    teams: teams ?? [],
    participantsByCategory,
  })

  return new NextResponse(pdfBuffer as any, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Buku Acara - ${event.nama}.pdf"`,
    },
  })
}
