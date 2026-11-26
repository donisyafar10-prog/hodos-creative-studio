'use server'

import { createServerClient } from '@/lib/supabase/server'
import { assignHeatsAndLanes } from '@/lib/heat-assignment'
import { redirect } from 'next/navigation'

export async function assignHeats(categoryId: string) {
  const supabase = createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['super_admin', 'admin', 'wasit'].includes(profile.role)) {
    return { error: 'Forbidden' }
  }

  // Fetch participants for this category
  const { data: participants, error: pError } = await supabase
    .from('participants')
    .select('id, nama, waktu_prestasi')
    .eq('event_category_id', categoryId)

  if (pError) {
    return { error: pError.message }
  }

  if (!participants || participants.length === 0) {
    return { error: 'Tidak ada peserta untuk kategori ini' }
  }

  // Clear existing heats/lanes for this category
  const { data: existingHeats } = await supabase
    .from('heats')
    .select('id')
    .eq('event_category_id', categoryId)

  if (existingHeats && existingHeats.length > 0) {
    const heatIds = existingHeats.map((h) => h.id)
    await supabase.from('heat_lanes').delete().in('heat_id', heatIds)
    await supabase.from('heats').delete().in('id', heatIds)
  }

  // Run assignment logic
  const { totalHeats, assignments } = assignHeatsAndLanes(
    participants.map((p) => ({
      id: p.id,
      nama: p.nama,
      waktu_prestasi: p.waktu_prestasi ?? '',
    }))
  )

  // Create heats
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
    return { error: hError.message }
  }

  const heatIdByNumber = new Map(
    newHeats!.map((h) => [h.nomor_heat, h.id] as [number, string])
  )

  // Create heat lanes
  const laneInserts = assignments.map((a) => ({
    heat_id: heatIdByNumber.get(a.heat)!,
    nomor_lintasan: a.lane,
    participant_id: a.participantId,
    waktu_prestasi: null,
  }))

  const { error: lError } = await supabase.from('heat_lanes').insert(laneInserts)

  if (lError) {
    return { error: lError.message }
  }

  redirect(`/admin/events/categories/${categoryId}/heats`)
}