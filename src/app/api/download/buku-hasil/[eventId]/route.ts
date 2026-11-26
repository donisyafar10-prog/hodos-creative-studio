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
  const recordMap: Record<string, { waktu_rekor: string; atlet: string; kejuaraan: string; tahun: number; tempat: string }> = {}
  for (const r of records ?? []) {
    recordMap[r.kategori] = { waktu_rekor: r.waktu_rekor, atlet: r.atlet, kejuaraan: r.kejuaraan, tahun: r.tahun, tempat: r.tempat }
  }

  const { data: teams } = await supabase.from('teams').select('id, nama').eq('event_id', eventId)

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Hodos Creative Studio'
  workbook.title = `Buku Hasil - ${event.nama}`

  // ===== Sheet 1: Buku Hasil per kategori (format VBA dengan breakdown per Seri/Heat) =====
  const sheet = workbook.addWorksheet('Buku Hasil')

  // Style defaults
  const titleFont = { size: 14, bold: true, name: 'Anton' }
  const headerFont = { bold: true, size: 10 }
  const dataFont = { size: 10 }
  const heatTitleFont = { bold: true, size: 10, color: { argb: 'FF000000' } }
  const thinBorder = {
    top: { style: 'thin' as const },
    bottom: { style: 'thin' as const },
    left: { style: 'thin' as const },
    right: { style: 'thin' as const },
  }
  const centerAlign = { horizontal: 'center' as const, vertical: 'middle' as const }
  const leftAlign = { horizontal: 'left' as const, vertical: 'middle' as const }

  let rowNum = 1

  const allProcessedResults: ProcessedResult[] = []

  const teamsMap = new Map<string, string>()
  for (const t of teams ?? []) {
    teamsMap.set(t.id, t.nama)
  }

  for (const cat of categories ?? []) {
    // Ambil heats dan lanes
    const { data: heats } = await supabase
      .from('heats')
      .select('id, nomor_heat')
      .eq('event_category_id', cat.id)
      .order('nomor_heat', { ascending: true })

    let lanes: any[] = []
    if (heats && heats.length > 0) {
      const heatIds = heats.map((h: any) => h.id)
      const { data: l } = await supabase
        .from('heat_lanes')
        .select('nomor_lintasan, participant_id, waktu_prestasi, heat_id')
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
        .select('id, nama, tahun_lahir, team_id, teams(nama)')
        .in('id', participantIds)
      participantsDetail = pds ?? []
    }

    const pMap = new Map(participantsDetail.map((p) => [p.id, p]))

    // Gabungkan data lane + participant
    const resultsInput = lanes
      .filter((lane) => lane.participant_id)
      .map((lane) => {
        const p = pMap.get(lane.participant_id)
        return {
          id: lane.participant_id,
          nama: p?.nama ?? '',
          tahunLahir: p?.tahun_lahir ?? null,
          teamId: p?.team_id ?? null,
          teamNama: (p as any)?.teams?.nama ?? null,
          waktuPrestasi: lane.waktu_prestasi ?? null,
          waktuAkhir: lane.waktu_prestasi ?? null,
          lane: lane.nomor_lintasan,
          heatId: lane.heat_id,
          categoryId: cat.id,
          jenisKelamin: cat.jenis_kelamin,
          isEstafet: false,
        }
      })

    const recordRaw = recordMap[`${cat.gaya} ${cat.jenis_kelamin}`]
    const record = recordRaw ? { waktuRe: recordRaw.waktu_rekor } : null
    const processed = processCategoryResults(resultsInput, record)

    allProcessedResults.push(...processed)

    // ===== Header Kategori =====
    // Row 1: Acara + kategori
    sheet.mergeCells(`A${rowNum}:K${rowNum}`)
    const catTitle = sheet.getCell(`A${rowNum}`)
    catTitle.value = `Acara ${cat.nomor_acara}                    ${cat.gaya} ${cat.jenis_kelamin.charAt(0).toUpperCase() + cat.jenis_kelamin.slice(1)}                AKHIR`
    catTitle.font = titleFont
    catTitle.alignment = { horizontal: 'left' }
    rowNum++

    // Row 2: Sesi
    sheet.mergeCells(`A${rowNum}:K${rowNum}`)
    const sesiCell = sheet.getCell(`A${rowNum}`)
    sesiCell.value = cat.sesi.charAt(0).toUpperCase() + cat.sesi.slice(1)
    sesiCell.font = { size: 12, bold: true }
    sesiCell.alignment = { horizontal: 'left' }
    rowNum++

    // Row 3: Record
    if (recordRaw) {
      sheet.mergeCells(`A${rowNum}:K${rowNum}`)
      const recCell = sheet.getCell(`A${rowNum}`)
      recCell.value = `Record: ${recordRaw.waktu_rekor} (${recordRaw.atlet} - ${recordRaw.kejuaraan} ${recordRaw.tahun}, ${recordRaw.tempat})`
      recCell.font = { size: 10, italic: true }
      recCell.alignment = { horizontal: 'left' }
      rowNum++
    }

    rowNum++ // blank row

    // ===== Header Kolom =====
    const headers = [
      'Pos',
      'Lintasan',
      'Nama Atlet',
      'Ket',
      'Lahir',
      'Group',
      'Nama Tim',
      'Prestasi',
      'Penyisihan',
      'Akhir',
      'HASIL GABUNGAN',
    ]

    const headerRow = sheet.addRow(headers)
    headerRow.font = headerFont
    headerRow.eachCell((cell) => {
      cell.border = thinBorder
      cell.alignment = centerAlign
    })
    rowNum++

    // ===== Breakdown per Heat/Seri =====
    if (heats && heats.length > 0) {
      for (const heat of heats) {
        const heatLanes = lanes
          .filter((l) => l.heat_id === heat.id)
          .sort((a, b) => a.nomor_lintasan - b.nomor_lintasan)

        // Heat/Seri title row
        sheet.mergeCells(`A${rowNum}:K${rowNum}`)
        const heatTitle = sheet.getCell(`A${rowNum}`)
        heatTitle.value = `SERI ${heat.nomor_heat}`
        heatTitle.font = heatTitleFont
        heatTitle.alignment = { horizontal: 'left' }
        rowNum++

        // Data rows for this heat
        for (const lane of heatLanes) {
          const p = pMap.get(lane.participant_id)
          if (!p) continue

          sheet.addRow([
            '-',                              // Pos (kosong untuk heat)
            lane.nomor_lintasan,              // Lintasan
            p.nama,                           // Nama Atlet
            '-',                              // Ket
            p.tahun_lahir ?? '-',             // Lahir
            '-',                              // Group
            (p as any)?.teams?.nama ?? '-',   // Nama Tim
            lane.waktu_prestasi ?? '-',       // Prestasi (waktu heat)
            '-',                              // Penyisihan
            '-',                              // Akhir
            '-',                              // HASIL GABUNGAN
          ]).eachCell((cell, colNum) => {
            cell.border = thinBorder
            cell.font = dataFont
            cell.alignment = colNum <= 2 ? centerAlign : leftAlign
          })
          rowNum++
        }

        rowNum++ // blank row after each heat
      }
    }

    // ===== HASIL GABUNGAN (Final Results) =====
    if (processed.length > 0) {
      sheet.mergeCells(`A${rowNum}:K${rowNum}`)
      const finalTitle = sheet.getCell(`A${rowNum}`)
      finalTitle.value = 'HASIL GABUNGAN'
      finalTitle.font = heatTitleFont
      finalTitle.alignment = { horizontal: 'left' }
      rowNum++

      // Header again for final results
      const headerRow2 = sheet.addRow(headers)
      headerRow2.font = headerFont
      headerRow2.eachCell((cell) => {
        cell.border = thinBorder
        cell.alignment = centerAlign
      })
      rowNum++

      for (const r of processed) {
        const p = pMap.get(r.participantId)
        const rekorTag = r.rekorFlag ? ' (R. Sultra)' : ''
        const ket = r.ket ? `${r.ket}${rekorTag}` : (rekorTag ? 'R. Sultra' : '-')

        sheet.addRow([
          r.posisi ?? '-',                    // Pos
          r.lane ?? '-',                      // Lintasan
          r.nama,                             // Nama Atlet
          ket,                                // Ket
          p?.tahunLahir ?? '-',               // Lahir
          '-',                                // Group
          r.teamNama ?? '-',                  // Nama Tim
          r.waktuAkhir ?? '-',              // Prestasi (waktu heat)
          '-',                                // Penyisihan
          r.waktuAkhir ?? '-',                // Akhir
          r.posisi ?? '-',                    // HASIL GABUNGAN
        ]).eachCell((cell, colNum) => {
          cell.border = thinBorder
          cell.font = dataFont
          cell.alignment = colNum <= 2 ? centerAlign : leftAlign
        })
        rowNum++
      }
    } else {
      sheet.mergeCells(`A${rowNum}:K${rowNum}`)
      const emptyCell = sheet.getCell(`A${rowNum}`)
      emptyCell.value = 'Belum ada hasil.'
      emptyCell.font = { italic: true, size: 10, color: { argb: 'FF666666' } }
      emptyCell.alignment = centerAlign
      emptyCell.border = thinBorder
      rowNum += 2
    }

    rowNum += 2 // blank rows between categories
  }

  // Set column widths
  sheet.getColumn('A').width = 6   // Pos
  sheet.getColumn('B').width = 10  // Lintasan
  sheet.getColumn('C').width = 30  // Nama Atlet
  sheet.getColumn('D').width = 8   // Ket
  sheet.getColumn('E').width = 8   // Lahir
  sheet.getColumn('F').width = 10  // Group
  sheet.getColumn('G').width = 25  // Nama Tim
  sheet.getColumn('H').width = 14  // Prestasi
  sheet.getColumn('I').width = 14  // Penyisihan
  sheet.getColumn('J').width = 14  // Akhir
  sheet.getColumn('K').width = 18  // HASIL GABUNGAN

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
    cell.border = thinBorder
    cell.alignment = centerAlign
  })

  const teamsForMedals = (teams ?? []).map((t) => ({ id: t.id, nama: t.nama }))
  const { teamMedals, bestSwimmerPutra, bestSwimmerPutri } = calculateMedals(allProcessedResults, teamsForMedals)

  let mRow = 3
  teamMedals.forEach((tm, i) => {
    const row = medalSheet.addRow([i + 1, tm.teamNama, tm.emas, tm.perak, tm.perunggu, tm.total])
    row.eachCell((cell) => {
      cell.border = thinBorder
      cell.alignment = centerAlign
    })
    mRow++
  })

  if (teamMedals.length === 0) {
    medalSheet.mergeCells(`A${mRow}:F${mRow}`)
    const emptyCell = medalSheet.getCell(`A${mRow}`)
    emptyCell.value = 'Belum ada data medali.'
    emptyCell.font = { italic: true, size: 10, color: { argb: 'FF666666' } }
    emptyCell.alignment = centerAlign
  }

  medalSheet.getColumn('A').width = 12
  medalSheet.getColumn('B').width = 30
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
    cell.border = thinBorder
    cell.alignment = centerAlign
  })

  let bRow = 4
  bestSwimmerPutra.forEach((s) => {
    const row = bestSheet.addRow([s.nama, s.teamNama, s.emas, s.perak, s.perunggu, s.total])
    row.eachCell((cell) => {
      cell.border = thinBorder
      cell.alignment = centerAlign
    })
    bRow++
  })
  if (bestSwimmerPutra.length === 0) {
    bestSheet.mergeCells(`A${bRow}:F${bRow}`)
    const e = bestSheet.getCell(`A${bRow}`)
    e.value = 'Belum ada data.'
    e.font = { italic: true, size: 10, color: { argb: 'FF666666' } }
    e.alignment = centerAlign
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
    cell.border = thinBorder
    cell.alignment = centerAlign
  })
  bRow++

  bestSwimmerPutri.forEach((s) => {
    const row = bestSheet.addRow([s.nama, s.teamNama, s.emas, s.perak, s.perunggu, s.total])
    row.eachCell((cell) => {
      cell.border = thinBorder
      cell.alignment = centerAlign
    })
    bRow++
  })
  if (bestSwimmerPutri.length === 0) {
    bestSheet.mergeCells(`A${bRow}:F${bRow}`)
    const e = bestSheet.getCell(`A${bRow}`)
    e.value = 'Belum ada data.'
    e.font = { italic: true, size: 10, color: { argb: 'FF666666' } }
    e.alignment = centerAlign
  }

  bestSheet.getColumn('A').width = 30
  bestSheet.getColumn('B').width = 25
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