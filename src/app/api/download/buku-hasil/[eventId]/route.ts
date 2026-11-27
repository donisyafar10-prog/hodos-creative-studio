import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { processCategoryResults, calculateMedals, type ProcessedResult } from '@/lib/results-processing'
import { makeBukuHasilPdf } from '@/lib/pdf-helper'

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

  const { data: records } = await supabase.from('records').select('*')
  const recordMap: Map<string, { waktu_rekor: string; atlet: string; kejuaraan: string; tahun: number; tempat: string }> = new Map()
  for (const r of records ?? []) {
    recordMap.set(`${r.gaya} ${r.jenis_kelamin}`, { waktu_rekor: r.waktu_rekor, atlet: r.atlet, kejuaraan: r.kejuaraan, tahun: r.tahun, tempat: r.tempat })
  }

  const { data: teams } = await supabase.from('teams').select('id, nama').eq('event_id', eventId)

  const heatsByCategory = new Map<string, Array<{ id: string; nomor_heat: number }>>()
  const lanesByHeat = new Map<string, Array<{ heat_id: string; nomor_lintasan: number; participant_id: string | null; waktu_prestasi: string | null }>>()
  const participantsById = new Map<string, { id: string; nama: string; tahun_lahir: number | null; team_id: string | null; team_nama: string | null }>()

  for (const cat of categories ?? []) {
    const { data: heats } = await supabase
      .from('heats')
      .select('id, nomor_heat')
      .eq('event_category_id', cat.id)
      .order('nomor_heat', { ascending: true })

    const heatList: Array<{ id: string; nomor_heat: number }> = (heats ?? []).map((h: any) => ({ id: h.id, nomor_heat: h.nomor_heat }))
    heatsByCategory.set(cat.id, heatList)

    if (heatList.length > 0) {
      const heatIds = heatList.map((h) => h.id)
      const { data: l } = await supabase
        .from('heat_lanes')
        .select('heat_id, nomor_lintasan, participant_id, waktu_prestasi')
        .in('heat_id', heatIds)
      const laneList = (l ?? []).map((lane: any) => ({
        heat_id: lane.heat_id,
        nomor_lintasan: lane.nomor_lintasan,
        participant_id: lane.participant_id,
        waktu_prestasi: lane.waktu_prestasi,
      }))
      lanesByHeat.set(heatList[0].id, laneList) // placeholder; fix below per heat

      // Group lanes per heat properly
      for (const h of heatList) {
        const hLanes = laneList.filter((lane) => lane.heat_id === h.id)
        lanesByHeat.set(h.id, hLanes)
      }
    }

    const participantIds = heatList.flatMap((h) => (lanesByHeat.get(h.id) ?? []).filter((lane) => lane.participant_id).map((lane) => lane.participant_id))
    if (participantIds.length > 0) {
      const { data: pds } = await supabase
        .from('participants')
        .select('id, nama, tahun_lahir, team_id, teams(nama)')
        .in('id', participantIds)
      for (const p of pds ?? []) {
        participantsById.set(p.id, {
          id: p.id,
          nama: p.nama,
          tahun_lahir: p.tahun_lahir ?? null,
          team_id: p.team_id,
          team_nama: (p as any)?.teams?.nama ?? null,
        })
      }
    }
  }

  const processedResultsByCategory = new Map<string, Array<{
    participantId: string
    nama: string
    teamNama: string | null
    waktuAkhir: string | null
    posisi: number | null
    ket: string | null
    rekorFlag: boolean
    lane: number
    jenisKelamin: string
  }>>()

  const allProcessedResults: ProcessedResult[] = []

  for (const cat of categories ?? []) {
    const lanes: any[] = []
    const heats = heatsByCategory.get(cat.id) ?? []
    for (const h of heats) {
      lanes.push(...(lanesByHeat.get(h.id) ?? []))
    }

    const resultsInput = lanes
      .filter((lane) => lane.participant_id)
      .map((lane) => {
        const p = participantsById.get(lane.participant_id)
        return {
          id: lane.participant_id,
          nama: p?.nama ?? '',
          teamId: p?.team_id ?? null,
          teamNama: p?.team_nama ?? null,
          waktuAkhir: lane.waktu_prestasi ?? null,
          lane: lane.nomor_lintasan,
          heatId: lane.heat_id,
          categoryId: cat.id,
          jenisKelamin: cat.jenis_kelamin,
          isEstafet: false,
        }
      })

    const recordRaw = recordMap.get(`${cat.gaya} ${cat.jenis_kelamin}`)
    const record = recordRaw ? { waktuRe: recordRaw.waktu_rekor } : null
    const processed = processCategoryResults(resultsInput, record)

    allProcessedResults.push(...processed)

    processedResultsByCategory.set(cat.id, processed.map((r) => ({
      participantId: r.participantId,
      nama: r.nama,
      teamNama: r.teamNama,
      waktuAkhir: r.waktuAkhir,
      posisi: r.posisi,
      ket: r.ket,
      rekorFlag: r.rekorFlag,
      lane: r.lane,
      jenisKelamin: r.jenisKelamin,
    })))
  }

  const teamsForMedals = (teams ?? []).map((t) => ({ id: t.id, nama: t.nama }))
  const { teamMedals, bestSwimmerPutra, bestSwimmerPutri } = calculateMedals(allProcessedResults, teamsForMedals)

  const pdfBuffer = makeBukuHasilPdf({
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
    heatsByCategory,
    lanesByHeat,
    participantsById,
    processedResultsByCategory,
    records: recordMap,
    teamMedals,
    bestSwimmerPutra,
    bestSwimmerPutri,
  })

  return new NextResponse(pdfBuffer as any, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Buku Hasil - ${event.nama}.pdf"`,
    },
  })
}
