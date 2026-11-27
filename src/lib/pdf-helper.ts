import { jsPDF } from 'jspdf'

export type DownloadRole = 'super_admin' | 'admin' | 'official' | 'wasit' | null

const DOWNLOADABLE_ROLES: DownloadRole[] = ['super_admin', 'admin', 'official']

export function isDownloadableRole(role: DownloadRole): boolean {
  return DOWNLOADABLE_ROLES.includes(role)
}

export function formatWaktu(seconds: number | null): string {
  if (!seconds || seconds >= 999998) return '-'
  const totalMs = Math.round(seconds * 100)
  const mm = Math.floor(totalMs / 600000)
  const ss = Math.floor((totalMs % 600000) / 1000)
  const cc = totalMs % 1000
  return `${String(mm).padStart(2, '0')},${String(ss).padStart(2, '0')},${String(cc).padStart(2, '0')}`
}

function mmToPt(mm: number): number {
  return (mm / 25.4) * 72
}

function drawTableRow(
  doc: jsPDF,
  startX: number,
  y: number,
  values: { text: string; width: number; align?: 'left' | 'center' }[]
) {
  let x = startX
  doc.setFontSize(8)
  for (const v of values) {
    const align = v.align ?? 'left'
    doc.text(v.text, x, y, { align: align as any, maxWidth: v.width })
    x += v.width
  }
}

export function makeBukuHasilPdf({
  event,
  categories,
  teams,
  heatsByCategory,
  lanesByHeat,
  participantsById,
  processedResultsByCategory,
  records,
  teamMedals,
  bestSwimmerPutra,
  bestSwimmerPutri,
}: {
  event: { nama: string; tanggal: string | null; lokasi: string | null }
  categories: Array<{
    id: string
    nomor_acara: string
    gaya: string
    jenis_kelamin: string
    sesi: string
    urutan: number
  }>
  teams: Array<{ id: string; nama: string }>
  heatsByCategory: Map<string, Array<{ id: string; nomor_heat: number }>>
  lanesByHeat: Map<string, Array<{ heat_id: string; nomor_lintasan: number; participant_id: string | null; waktu_prestasi: string | null }>>
  participantsById: Map<string, { id: string; nama: string; tahun_lahir: number | null; team_id: string | null; team_nama: string | null }>
  processedResultsByCategory: Map<string, Array<{
    participantId: string
    nama: string
    teamNama: string | null
    waktuAkhir: string | null
    posisi: number | null
    ket: string | null
    rekorFlag: boolean
    lane: number
    jenisKelamin: string
  }>>
  records: Map<string, { waktu_rekor: string; atlet: string; kejuaraan: string; tahun: number; tempat: string }>
  teamMedals: Array<{ teamNama: string; emas: number; perak: number; perunggu: number; total: number }>
  bestSwimmerPutra: Array<{ nama: string; teamNama: string; emas: number; perak: number; perunggu: number; total: number }>
  bestSwimmerPutri: Array<{ nama: string; teamNama: string; emas: number; perak: number; perunggu: number; total: number }>
}): Buffer {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const startX = 15
  const pageWidth = 210 - 15 - 15 // content width

  const tableHeaders = ['Pos', 'Lintasan', 'Nama Atlet', 'Ket', 'Lahir', 'Group', 'Nama Tim', 'Prestasi', 'Penyisihan', 'Akhir', 'HASIL GABUNGAN']
  const colWidths = [12, 15, 40, 15, 12, 12, 35, 20, 20, 15, 25]

  // ===== Title =====
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(242, 20, 12) // helix red
  doc.text('BUKU HASIL', 105, 20, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)
  doc.text(event.nama.toUpperCase(), 105, 30, { align: 'center' })

  doc.setFontSize(9)
  const tgl = event.tanggal ? new Date(event.tanggal).toLocaleDateString('id-ID') : '-'
  doc.text(`${tgl} | ${event.lokasi || '-'}`, 105, 38, { align: 'center' })

  let y = 52

  for (const cat of categories) {
    // New page per category to keep layout clean
    if (y > 250) {
      doc.addPage()
      y = 20
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(`Acara ${cat.nomor_acara}  ${cat.gaya} ${cat.jenis_kelamin.charAt(0).toUpperCase() + cat.jenis_kelamin.slice(1)}  AKHIR`, startX, y)
    y += 6

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(cat.sesi.charAt(0).toUpperCase() + cat.sesi.slice(1), startX, y)
    y += 5

    const recordRaw = records.get(`${cat.gaya} ${cat.jenis_kelamin}`)
    if (recordRaw) {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(8)
      doc.text(`Record: ${recordRaw.waktu_rekor} (${recordRaw.atlet} - ${recordRaw.kejuaraan} ${recordRaw.tahun}, ${recordRaw.tempat})`, startX, y)
      y += 5
    }
    y += 2

    // Header row
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(0, 0, 0)
    let hx1 = startX
    tableHeaders.forEach((h, i) => {
      doc.text(h, hx1, y, { align: 'center' as const, maxWidth: colWidths[i] })
      hx1 += colWidths[i]
    })
    y += 5

    const heats = heatsByCategory.get(cat.id) ?? []

    // Breakdown per Heat
    for (const heat of heats) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(242, 20, 12)
      doc.text(`SERI ${heat.nomor_heat}`, startX, y)
      y += 5

      const heatLanes = (lanesByHeat.get(heat.id) ?? []).sort((a, b) => (a.nomor_lintasan ?? 0) - (b.nomor_lintasan ?? 0))
      for (const lane of heatLanes) {
        const p = lane.participant_id ? participantsById.get(lane.participant_id) : null
        if (!p) continue

        const rowVals = [
          { text: '-', width: colWidths[0], align: 'center' as const },
          { text: String(lane.nomor_lintasan), width: colWidths[1], align: 'center' as const },
          { text: p.nama, width: colWidths[2] },
          { text: '-', width: colWidths[3], align: 'center' as const },
          { text: String(p.tahun_lahir ?? '-'), width: colWidths[4], align: 'center' as const },
          { text: '-', width: colWidths[5], align: 'center' as const },
          { text: p.team_nama ?? '-', width: colWidths[6] },
          { text: lane.waktu_prestasi ?? '-', width: colWidths[7], align: 'center' as const },
          { text: '-', width: colWidths[8], align: 'center' as const },
          { text: '-', width: colWidths[9], align: 'center' as const },
          { text: '-', width: colWidths[10], align: 'center' as const },
        ]
        drawTableRow(doc, startX, y, rowVals)
        y += 4.5
      }
      y += 3
    }

    // HASIL GABUNGAN
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(0, 0, 0)
    doc.text('HASIL GABUNGAN', startX, y)
    y += 5

    // Header again
    let hx2 = startX
    tableHeaders.forEach((h, i) => {
      doc.text(h, hx2, y, { align: 'center' as const, maxWidth: colWidths[i] })
      hx2 += colWidths[i]
    })
    y += 5

    const processed = processedResultsByCategory.get(cat.id) ?? []
    if (processed.length > 0) {
      for (const r of processed) {
        const p = participantsById.get(r.participantId)
        const rekorTag = r.rekorFlag ? ' (R. Sultra)' : ''
        const ket = r.ket ? `${r.ket}${rekorTag}` : (rekorTag ? 'R. Sultra' : '-')

        const rowVals = [
          { text: String(r.posisi ?? '-'), width: colWidths[0], align: 'center' as const },
          { text: String(r.lane ?? '-'), width: colWidths[1], align: 'center' as const },
          { text: r.nama, width: colWidths[2] },
          { text: ket, width: colWidths[3] },
          { text: String(p?.tahun_lahir ?? '-'), width: colWidths[4], align: 'center' as const },
          { text: '-', width: colWidths[5], align: 'center' as const },
          { text: r.teamNama ?? '-', width: colWidths[6] },
          { text: r.waktuAkhir ?? '-', width: colWidths[7], align: 'center' as const },
          { text: '-', width: colWidths[8], align: 'center' as const },
          { text: r.waktuAkhir ?? '-', width: colWidths[9], align: 'center' as const },
          { text: String(r.posisi ?? '-'), width: colWidths[10], align: 'center' as const },
        ]
        drawTableRow(doc, startX, y, rowVals)
        y += 4.5
      }
    } else {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(8)
      doc.setTextColor(102, 102, 102)
      doc.text('Belum ada hasil.', startX, y)
      y += 6
    }

    y += 8
  }

  // ===== Rekap Medali =====
  doc.addPage()
  y = 20
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(242, 20, 12)
  doc.text(`REKAP MEDALI — ${event.nama.toUpperCase()}`, 105, y, { align: 'center' })
  y += 10

  const medalHeaders = ['Peringkat', 'Tim', 'Emas', 'Perak', 'Perunggu', 'Total']
  const medalWidths = [20, 55, 15, 15, 20, 15]

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(0, 0, 0)
  let mx = startX
  medalHeaders.forEach((h, i) => {
    doc.text(h, mx, y, { align: 'center' as const, maxWidth: medalWidths[i] })
    mx += medalWidths[i]
  })
  y += 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  if (teamMedals.length > 0) {
    teamMedals.forEach((tm, i) => {
      const rowVals = [
        { text: String(i + 1), width: medalWidths[0], align: 'center' as const },
        { text: tm.teamNama, width: medalWidths[1] },
        { text: String(tm.emas), width: medalWidths[2], align: 'center' as const },
        { text: String(tm.perak), width: medalWidths[3], align: 'center' as const },
        { text: String(tm.perunggu), width: medalWidths[4], align: 'center' as const },
        { text: String(tm.total), width: medalWidths[5], align: 'center' as const },
      ]
      drawTableRow(doc, startX, y, rowVals)
      y += 4.5
    })
  } else {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(102, 102, 102)
    doc.text('Belum ada data medali.', startX, y)
    y += 6
  }

  // ===== Best Swimmer =====
  doc.addPage()
  y = 20
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(242, 20, 12)
  doc.text(`ATLET TERBAIK — ${event.nama.toUpperCase()}`, 105, y, { align: 'center' })
  y += 10

  const bestWidths = [45, 40, 15, 15, 20, 15]
  const bestHeaders = ['Atlet', 'Tim', 'Emas', 'Perak', 'Perunggu', 'Total']

  const renderBestSection = (title: string, swimmers: Array<{ nama: string; teamNama: string; emas: number; perak: number; perunggu: number; total: number }>) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(0, 0, 0)
    doc.text(title, startX, y)
    y += 6

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    let bx = startX
    bestHeaders.forEach((h, i) => {
      doc.text(h, bx, y, { align: 'center' as const, maxWidth: bestWidths[i] })
      bx += bestWidths[i]
    })
    y += 5

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    if (swimmers.length > 0) {
      swimmers.forEach((s) => {
        const rowVals = [
          { text: s.nama, width: bestWidths[0] },
          { text: s.teamNama, width: bestWidths[1] },
          { text: String(s.emas), width: bestWidths[2], align: 'center' as const },
          { text: String(s.perak), width: bestWidths[3], align: 'center' as const },
          { text: String(s.perunggu), width: bestWidths[4], align: 'center' as const },
          { text: String(s.total), width: bestWidths[5], align: 'center' as const },
        ]
        drawTableRow(doc, startX, y, rowVals)
        y += 4.5
      })
    } else {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(8)
      doc.setTextColor(102, 102, 102)
      doc.text('Belum ada data.', startX, y)
      y += 6
    }
    y += 8
  }

  renderBestSection('Putra', bestSwimmerPutra)
  renderBestSection('Putri', bestSwimmerPutri)

  const arrayBuffer = doc.output('arraybuffer')
  return Buffer.from(arrayBuffer)
}

export function makeBukuAcaraPdf({
  event,
  categories,
  teams,
  participantsByCategory,
}: {
  event: { nama: string; tanggal: string | null; lokasi: string | null }
  categories: Array<{ id: string; nomor_acara: string; gaya: string; jenis_kelamin: string; sesi: string; urutan: number }>
  teams: Array<{ id: string; nama: string }>
  participantsByCategory: Map<string, Array<{ id: string; nama: string; team_nama: string | null }>>
}): Buffer {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const startX = 15

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(242, 20, 12)
  doc.text('BUKU ACARA', 105, 20, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)
  doc.text(event.nama.toUpperCase(), 105, 30, { align: 'center' })

  doc.setFontSize(9)
  const tgl = event.tanggal ? new Date(event.tanggal).toLocaleDateString('id-ID') : '-'
  doc.text(`${tgl} | ${event.lokasi || '-'}`, 105, 38, { align: 'center' })

  let y = 52

  const headers = ['No Acara', 'Kategori', 'Jenis Kelamin', 'Sesi', 'Peserta', 'Tim']
  const widths = [22, 35, 28, 22, 42, 42]

  for (const cat of categories) {
    if (y > 250) {
      doc.addPage()
      y = 20
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(`Acara ${cat.nomor_acara} — ${cat.gaya} ${cat.jenis_kelamin} (${cat.sesi})`, startX, y)
    y += 6

    // Header row
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(0, 0, 0)
    let hx1 = startX
    headers.forEach((h, i) => {
      doc.text(h, hx1, y, { align: 'center' as const, maxWidth: widths[i] })
      hx1 += widths[i]
    })
    y += 5

    const participants = participantsByCategory.get(cat.id) ?? []
    if (participants.length === 0) {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(8)
      doc.setTextColor(102, 102, 102)
      doc.text('Belum ada peserta terdaftar.', startX, y)
      y += 6
      continue
    }

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    for (const p of participants) {
      const rowVals = [
        { text: cat.nomor_acara, width: widths[0], align: 'center' as const },
        { text: cat.gaya, width: widths[1] },
        { text: cat.jenis_kelamin, width: widths[2], align: 'center' as const },
        { text: cat.sesi, width: widths[3], align: 'center' as const },
        { text: p.nama, width: widths[4] },
        { text: p.team_nama ?? '-', width: widths[5] },
      ]
      drawTableRow(doc, startX, y, rowVals)
      y += 4.5
    }
    y += 6
  }

  const arrayBuffer = doc.output('arraybuffer')
  return Buffer.from(arrayBuffer)
}
