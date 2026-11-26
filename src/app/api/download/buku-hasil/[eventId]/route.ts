import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import ExcelJS from 'exceljs'
import { processCategoryResults, calculateMedals, type ProcessedResult } from '@/lib/results-processing'

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
  const recordMap: Record<string, { waktu_rekor: string }> = {}
  for (const r of records ?? []) {
    recordMap[r.kategori] = { waktu_rekor: r.waktu_rekor }
  }

  const { data: teams } = await supabase.from('teams').select('id, nama').eq('event_id', eventId)

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Hodos Creative Studio'
  workbook.title = `Buku Hasil - ${event.nama}`

  // ===== Sheet 1: Buku Hasil per kategori =====
  const sheet = workbook.addWorksheet('Buku Hasil')

  sheet.mergeCells('A1:H1')
  const titleCell = sheet.getCell('A1')
  titleCell.value = `BUKU HASIL — ${event.nama.toUpperCase()}`
  titleCell.font = { size: 16, bold: true, name: 'Anton' }
  titleCell.alignment = { horizontal: 'center' }

  sheet.mergeCells('A2:H2')
  const subtitleCell = sheet.getCell('A2')
  subtitleCell.value = `${event.tanggal ? new Date(event.tanggal).toLocaleDateString('id-ID') : '-'} | ${event.lokasi || '-'}`
  subtitleCell.alignment = { horizontal: 'center' }

  const headerRow = sheet.addRow([
    'Peringkat',
    'No Acara',
    'Kategori',
    'Lintasan',
    'Atlet',
    'Tim',
    'Waktu Akhir',
    'Keterangan',
  ])
  headerRow.font = { bold: true }
  headerRow.eachCell((cell) => {
    cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
    cell.alignment = { horizontal: 'center' }
  })

  let rowNum = 4

  const allProcessedResults: ProcessedResult[] = []

  const teamsMap = new Map<string, string>()
  for (const t of teams ?? []) {
    teamsMap.set(t.id, t.nama)
  }

  for (const cat of categories ?? []) {
    const { data: heats } = await supabase
      .from('heats')
      .select('id')
      .eq('event_category_id', cat.id)

    let lanes: any[] = []
    if (heats && heats.length > 0) {
      const heatIds = heats.map((h: any) => h.id)
      const { data: l } = await supabase
        .from('heat_lanes')
        .select('nomor_lintasan, participant_id, waktu_prestasi')
        .in('heat_id', heatIds)
      lanes = l ?? []
    }

    const participantIds = lanes
      .filter((lane) => lane.participant_id)
      .map((lane) => lane.participant_id)

    let participantsDetail: any[] = []
    if (participantIds.length > 0) {
      const { data: pds } = await supabase
        .from('participants')
        .select('id, nama, team_id, teams(nama)')
        .in('id', participantIds)
      participantsDetail = pds ?? []
    }

    const pMap = new Map(participantsDetail.map((p) => [p.id, p]))

    const resultsInput = lanes
      .filter((lane) => lane.participant_id)
      .map((lane) => {
        const p = pMap.get(lane.participant_id)
        return {
          id: lane.participant_id,
          nama: p?.nama ?? '',
          teamId: p?.team_id ?? null,
          teamNama: (p as any)?.teams?.nama ?? null,
          waktuAkhir: lane.waktu_prestasi ?? null,
          lane: lane.nomor_lintasan,
          categoryId: cat.id,
          jenisKelamin: cat.jenis_kelamin,
          isEstafet: false,
        }
      })

    const recordRaw = recordMap[`${cat.gaya} ${cat.jenis_kelamin}`]
    const record = recordRaw ? { waktuRe: recordRaw.waktu_rekor } : null
    const processed = processCategoryResults(resultsInput, record)

    allProcessedResults.push(...processed)

    // Category title row
    sheet.mergeCells(`A${rowNum}:H${rowNum}`)
    const catCell = sheet.getCell(`A${rowNum}`)
    catCell.value = `Acara ${cat.nomor_acara} — ${cat.gaya} ${cat.jenis_kelamin} (${cat.sesi})`
    catCell.font = { bold: true, size: 12, name: 'Anton' }
    catCell.alignment = { horizontal: 'left' }
    rowNum++

    const resultHeader = sheet.addRow([
      'Peringkat',
      'No Acara',
      'Kategori',
      'Lintasan',
      'Atlet',
      'Tim',
      'Waktu Akhir',
      'Keterangan',
    ])
    resultHeader.font = { bold: true, size: 10 }
    resultHeader.eachCell((cell) => {
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
      cell.alignment = { horizontal: 'center' }
    })
    rowNum++

    if (processed.length === 0) {
      sheet.mergeCells(`A${rowNum}:H${rowNum}`)
      const emptyCell = sheet.getCell(`A${rowNum}`)
      emptyCell.value = 'Belum ada hasil.'
      emptyCell.font = { italic: true, size: 10, color: { argb: 'FF666666' } }
      rowNum += 2
      continue
    }

    for (const r of processed) {
      const rekorTag = r.rekorFlag ? ' (R. Sultra)' : ''
      const ket = r.ket ? `${r.ket}${rekorTag}` : rekorTag || '-'
      sheet.addRow([
        r.posisi ?? '-',
        cat.nomor_acara,
        `${cat.gaya} ${cat.jenis_kelamin}`,
        r.lane,
        r.nama,
        r.teamNama ?? '-',
        r.waktuAkhir ?? '-',
        ket,
      ])
      rowNum++
    }

    rowNum++ // blank row between categories
  }

  sheet.getColumn('A').width = 10
  sheet.getColumn('B').width = 12
  sheet.getColumn('C').width = 24
  sheet.getColumn('D').width = 10
  sheet.getColumn('E').width = 24
  sheet.getColumn('F').width = 22
  sheet.getColumn('G').width = 14
  sheet.getColumn('H').width = 18

  // ===== Sheet 2: Rekap Medali =====
  const medalSheet = workbook.addWorksheet('Rekap Medali')

  medalSheet.mergeCells('A1:F1')
  const mTitle = medalSheet.getCell('A1')
  mTitle.value = `REKAP MEDALI — ${event.nama.toUpperCase()}`
  mTitle.font = { size: 16, bold: true, name: 'Anton' }
  mTitle.alignment = { horizontal: 'center' }

  const mHeader = medalSheet.addRow([
    'Peringkat',
    'Tim',
    'Emas',
    'Perak',
    'Perunggu',
    'Total',
  ])
  mHeader.font = { bold: true }
  mHeader.eachCell((cell) => {
    cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
    cell.alignment = { horizontal: 'center' }
  })

  const teamsForMedals = (teams ?? []).map((t) => ({ id: t.id, nama: t.nama }))
  const { teamMedals, bestSwimmerPutra, bestSwimmerPutri } = calculateMedals(allProcessedResults, teamsForMedals)

  let mRow = 3
  teamMedals.forEach((tm, i) => {
    medalSheet.addRow([i + 1, tm.teamNama, tm.emas, tm.perak, tm.perunggu, tm.total])
    mRow++
  })

  if (teamMedals.length === 0) {
    medalSheet.mergeCells(`A${mRow}:F${mRow}`)
    const emptyCell = medalSheet.getCell(`A${mRow}`)
    emptyCell.value = 'Belum ada data medali.'
    emptyCell.font = { italic: true, size: 10, color: { argb: 'FF666666' } }
  }

  medalSheet.getColumn('A').width = 10
  medalSheet.getColumn('B').width = 24
  medalSheet.getColumn('C').width = 10
  medalSheet.getColumn('D').width = 10
  medalSheet.getColumn('E').width = 12
  medalSheet.getColumn('F').width = 10

  // ===== Sheet 3: Best Swimmer =====
  const bestSheet = workbook.addWorksheet('Best Swimmer')

  bestSheet.mergeCells('A1:F1')
  const bTitle = bestSheet.getCell('A1')
  bTitle.value = `ATLET TERBAIK — ${event.nama.toUpperCase()}`
  bTitle.font = { size: 16, bold: true, name: 'Anton' }
  bTitle.alignment = { horizontal: 'center' }

  bestSheet.mergeCells('A2:F2')
  const bSub = bestSheet.getCell('A2')
  bSub.value = 'Putra'
  bSub.font = { bold: true, size: 12 }
  bSub.alignment = { horizontal: 'left' }

  const bHeader1 = bestSheet.addRow(['Atlet', 'Tim', 'Emas', 'Perak', 'Perunggu', 'Total'])
  bHeader1.font = { bold: true }
  bHeader1.eachCell((cell) => {
    cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
    cell.alignment = { horizontal: 'center' }
  })

  let bRow = 4
  bestSwimmerPutra.forEach((s) => {
    bestSheet.addRow([s.nama, s.teamNama, s.emas, s.perak, s.perunggu, s.total])
    bRow++
  })
  if (bestSwimmerPutra.length === 0) {
    bestSheet.mergeCells(`A${bRow}:F${bRow}`)
    const e = bestSheet.getCell(`A${bRow}`)
    e.value = 'Belum ada data.'
    e.font = { italic: true, size: 10, color: { argb: 'FF666666' } }
    bRow++
  }

  bRow++
  const bSub2 = bestSheet.getCell(`A${bRow}`)
  bSub2.value = 'Putri'
  bSub2.font = { bold: true, size: 12 }
  bSub2.alignment = { horizontal: 'left' }
  bRow++

  const bHeader2 = bestSheet.addRow(['Atlet', 'Tim', 'Emas', 'Perak', 'Perunggu', 'Total'])
  bHeader2.font = { bold: true }
  bHeader2.eachCell((cell) => {
    cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
    cell.alignment = { horizontal: 'center' }
  })
  bRow++

  bestSwimmerPutri.forEach((s) => {
    bestSheet.addRow([s.nama, s.teamNama, s.emas, s.perak, s.perunggu, s.total])
    bRow++
  })
  if (bestSwimmerPutri.length === 0) {
    bestSheet.mergeCells(`A${bRow}:F${bRow}`)
    const e = bestSheet.getCell(`A${bRow}`)
    e.value = 'Belum ada data.'
    e.font = { italic: true, size: 10, color: { argb: 'FF666666' } }
  }

  bestSheet.getColumn('A').width = 24
  bestSheet.getColumn('B').width = 22
  bestSheet.getColumn('C').width = 10
  bestSheet.getColumn('D').width = 10
  bestSheet.getColumn('E').width = 12
  bestSheet.getColumn('F').width = 10

  const buffer = await workbook.xlsx.writeBuffer()

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Buku Hasil - ${event.nama}.xlsx"`,
    },
  })
}
