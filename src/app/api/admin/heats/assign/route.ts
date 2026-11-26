import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { assignHeatsAndLanes } from '@/lib/heat-assignment'

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

  if (!profile || !['super_admin', 'admin', 'wasit'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { categoryId } = body

  if (!categoryId) {
    return NextResponse.json({ error: 'Category ID required' }, { status: 400 })
  }

  const { data: participants, error: pError } = await supabase
    .from('participants')
    .select('id, nama, waktu_prestasi')
    .eq('event_category_id', categoryId)

  if (pError) {
    return NextResponse.json({ error: pError.message }, { status: 500 })
  }

  if (!participants || participants.length === 0) {
    return NextResponse.json({ error: 'No participants' }, { status: 400 })
  }

  // Clear existing
  const { data: existingHeats } = await supabase
    .from('heats')
    .select('id')
    .eq('event_category_id', categoryId)

  if (existingHeats && existingHeats.length > 0) {
    const heatIds = existingHeats.map((h) => h.id)
    await supabase.from('heat_lanes').delete().in('heat_id', heatIds)
    await supabase.from('heats').delete().in('id', heatIds)
  }

  const { totalHeats, assignments } = assignHeatsAndLanes(
    participants.map((p) => ({
      id: p.id,
      nama: p.nama,
      waktu_prestasi: p.waktu_prestasi ?? '',
    }))
  )

  const { data: newHeats, error: hError } = await supabase
    .from('heats')
    .insert(
      Array.from({ length: totalHeats }, (_, i) => ({
        event_category_id: categoryId,
        nomor_heat: i + 1,
      }))
    )
    .select('id, nomor_heat')

  if (hError) {
    return NextResponse.json({ error: hError.message }, { status: 500 })
  }

  const heatIdByNumber = new Map(newHeats!.map((h) => [h.nomor_heat, h.id]))

  const laneInserts = assignments.map((a) => ({
    heat_id: heatIdByNumber.get(a.heat)!,
    nomor_lintasan: a.lane,
    participant_id: a.participantId,
    waktu_prestasi: null,
  }))

  const { error: lError } = await supabase.from('heat_lanes').insert(laneInserts)

  if (lError) {
    return NextResponse.json({ error: lError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, totalHeats, assignments })
}