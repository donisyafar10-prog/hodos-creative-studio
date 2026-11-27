import PDFDocument from 'pdfkit'

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
  const mmStr = String(mm).padStart(2, '0')
  const ssStr = String(ss).padStart(2, '0')
  const ccStr = String(cc).padStart(2, '0')
  return `${mmStr},${ssStr},${ccStr}`
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
  const doc = new PDFDocument({ size: 'A4', margin: 50 })
  const chunks: Buffer[] = []
  doc.on('data', (c: Buffer) => chunks.push(c))

  const teamsMap = new Map(teams.map((t) => [t.id, t.nama]))

  // ===== Title =====
  doc.font('Helvetica-Bold').fontSize(20).fillColor('#f2140c')
  doc.text('BUKU HASIL', { align: 'center' })
  doc.moveDown(0.5)
  doc.font('Helvetica').fontSize(12).fillColor('#000')
  doc.text(event.nama.toUpperCase(), { align: 'center' })
  doc.moveDown(0.5)
  const tgl = event.tanggal ? new Date(event.tanggal).toLocaleDateString('id-ID') : '-'
  doc.text(`${tgl} | ${event.lokasi || '-'}`, { align: 'center' })
  doc.moveDown(1.5)

  // Table header helper
  const tableHeaders = ['Pos', 'Lintasan', 'Nama Atlet', 'Ket', 'Lahir', 'Group', 'Nama Tim', 'Prestasi', 'Penyisihan', 'Akhir', 'HASIL GABUNGAN']
  const colWidths = [35, 50, 110, 50, 40, 40, 90, 60, 60, 50, 80]

  for (const cat of categories) {
    doc.font('Helvetica-Bold').fontSize(13)
    doc.text(`Acara ${cat.nomor_acara}  ${cat.gaya} ${cat.jenis_kelamin.charAt(0).toUpperCase() + cat.jenis_kelamin.slice(1)}  AKHIR`, { continued: false })
    doc.moveDown(0.3)
    doc.font('Helvetica-Bold').fontSize(11)
    doc.text(cat.sesi.charAt(0).toUpperCase() + cat.sesi.slice(1))
    doc.moveDown(0.3)

    const recordRaw = records.get(`${cat.gaya} ${cat.jenis_kelamin}`)
    if (recordRaw) {
      doc.font('Helvetica-Oblique').fontSize(9)
      doc.text(`Record: ${recordRaw.waktu_rekor} (${recordRaw.atlet} - ${recordRaw.kejuaraan} ${recordRaw.tahun}, ${recordRaw.tempat})`)
      doc.moveDown(0.3)
    }
    doc.moveDown(0.2)

    // Header row
    const startX = doc.page.margins.left
    let y = doc.y
    doc.font('Helvetica-Bold').fontSize(8)
    tableHeaders.forEach((h, i) => {
      doc.text(h, doc.page.margins.left + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y, { width: colWidths[i], align: 'center' })
    })
    doc.moveDown(0.4)

    const heats = heatsByCategory.get(cat.id) ?? []
    const processed = processedResultsByCategory.get(cat.id) ?? []

    // Breakdown per Heat
    for (const heat of heats) {
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#f2140c')
      doc.text(`SERI ${heat.nomor_heat}`)
      doc.moveDown(0.3)

      const heatLanes = (lanesByHeat.get(heat.id) ?? []).sort((a, b) => (a.nomor_lintasan ?? 0) - (b.nomor_lintasan ?? 0))
      for (const lane of heatLanes) {
        const p = lane.participant_id ? participantsById.get(lane.participant_id) : null
        if (!p) continue

        const rowX = doc.page.margins.left
        doc.font('Helvetica').fontSize(8)
        doc.text('-', rowX, doc.y, { width: colWidths[0], align: 'center' })
        doc.text(String(lane.nomor_lintasan), rowX + colWidths[0], doc.y, { width: colWidths[1], align: 'center' })
        doc.text(p.nama, rowX + colWidths[0] + colWidths[1], doc.y, { width: colWidths[2] })
        doc.text('-', rowX + colWidths[0] + colWidths[1] + colWidths[2], doc.y, { width: colWidths[3], align: 'center' })
        doc.text(String(p.tahun_lahir ?? '-'), rowX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], doc.y, { width: colWidths[4], align: 'center' })
        doc.text('-', rowX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], doc.y, { width: colWidths[5], align: 'center' })
        doc.text(p.team_nama ?? '-', rowX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5], doc.y, { width: colWidths[6] })
        doc.text(lane.waktu_prestasi ?? '-', rowX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] + colWidths[6], doc.y, { width: colWidths[7], align: 'center' })
        doc.text('-', rowX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] + colWidths[6] + colWidths[7], doc.y, { width: colWidths[8], align: 'center' })
        doc.text('-', rowX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] + colWidths[6] + colWidths[7] + colWidths[8], doc.y, { width: colWidths[9], align: 'center' })
        doc.text('-', rowX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] + colWidths[6] + colWidths[7] + colWidths[8] + colWidths[9], doc.y, { width: colWidths[10], align: 'center' })
        doc.moveDown(0.25)
      }
      doc.moveDown(0.3)
    }

    // HASIL GABUNGAN
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#000')
    doc.text('HASIL GABUNGAN')
    doc.moveDown(0.3)

    // Header again
    let hx = doc.page.margins.left
    tableHeaders.forEach((h, i) => {
      doc.text(h, hx, doc.y, { width: colWidths[i], align: 'center' })
      hx += colWidths[i]
    })
    doc.moveDown(0.3)

    if (processed.length > 0) {
      for (const r of processed) {
        const p = participantsById.get(r.participantId)
        const rekorTag = r.rekorFlag ? ' (R. Sultra)' : ''
        const ket = r.ket ? `${r.ket}${rekorTag}` : (rekorTag ? 'R. Sultra' : '-')

        const rowX = doc.page.margins.left
        doc.font('Helvetica').fontSize(8)
        doc.text(String(r.posisi ?? '-'), rowX, doc.y, { width: colWidths[0], align: 'center' })
        doc.text(String(r.lane ?? '-'), rowX + colWidths[0], doc.y, { width: colWidths[1], align: 'center' })
        doc.text(r.nama, rowX + colWidths[0] + colWidths[1], doc.y, { width: colWidths[2] })
        doc.text(ket, rowX + colWidths[0] + colWidths[1] + colWidths[2], doc.y, { width: colWidths[3] })
        doc.text(String(p?.tahun_lahir ?? '-'), rowX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], doc.y, { width: colWidths[4], align: 'center' })
        doc.text('-', rowX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], doc.y, { width: colWidths[5], align: 'center' })
        doc.text(r.teamNama ?? '-', rowX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5], doc.y, { width: colWidths[6] })
        doc.text(r.waktuAkhir ?? '-', rowX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] + colWidths[6], doc.y, { width: colWidths[7], align: 'center' })
        doc.text('-', rowX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] + colWidths[6] + colWidths[7], doc.y, { width: colWidths[8], align: 'center' })
        doc.text(r.waktuAkhir ?? '-', rowX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] + colWidths[6] + colWidths[7] + colWidths[8], doc.y, { width: colWidths[9], align: 'center' })
        doc.text(String(r.posisi ?? '-'), rowX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] + colWidths[6] + colWidths[7] + colWidths[8] + colWidths[9], doc.y, { width: colWidths[10], align: 'center' })
        doc.moveDown(0.25)
      }
    } else {
      doc.font('Helvetica-Oblique').fontSize(9).fillColor('#666')
      doc.text('Belum ada hasil.', { align: 'center' })
      doc.moveDown(0.5)
    }

    doc.moveDown(1)
    doc.addPage()
  }

  // ===== Sheet 2: Rekap Medali =====
  doc.font('Helvetica-Bold').fontSize(16).fillColor('#f2140c')
  doc.text(`REKAP MEDALI — ${event.nama.toUpperCase()}`, { align: 'center' })
  doc.moveDown(0.5)

  doc.font('Helvetica-Bold').fontSize(9)
  const medalHeaders = ['Peringkat', 'Tim', 'Emas', 'Perak', 'Perunggu', 'Total']
  const medalWidths = [70, 120, 50, 50, 60, 50]
  let mx = doc.page.margins.left
  medalHeaders.forEach((h, i) => {
    doc.text(h, mx, doc.y, { width: medalWidths[i], align: 'center' })
    mx += medalWidths[i]
  })
  doc.moveDown(0.3)

  doc.font('Helvetica').fontSize(9)
  if (teamMedals.length > 0) {
    teamMedals.forEach((tm, i) => {
      const mrowX = doc.page.margins.left
      doc.text(String(i + 1), mrowX, doc.y, { width: medalWidths[0], align: 'center' })
      doc.text(tm.teamNama, mrowX + medalWidths[0], doc.y, { width: medalWidths[1] })
      doc.text(String(tm.emas), mrowX + medalWidths[0] + medalWidths[1], doc.y, { width: medalWidths[2], align: 'center' })
      doc.text(String(tm.perak), mrowX + medalWidths[0] + medalWidths[1] + medalWidths[2], doc.y, { width: medalWidths[3], align: 'center' })
      doc.text(String(tm.perunggu), mrowX + medalWidths[0] + medalWidths[1] + medalWidths[2] + medalWidths[3], doc.y, { width: medalWidths[4], align: 'center' })
      doc.text(String(tm.total), mrowX + medalWidths[0] + medalWidths[1] + medalWidths[2] + medalWidths[3] + medalWidths[4], doc.y, { width: medalWidths[5], align: 'center' })
      doc.moveDown(0.25)
    })
  } else {
    doc.font('Helvetica-Oblique').fontSize(9).fillColor('#666')
    doc.text('Belum ada data medali.', { align: 'center' })
    doc.moveDown(0.5)
  }

  doc.addPage()

  // ===== Sheet 3: Best Swimmer =====
  doc.font('Helvetica-Bold').fontSize(16).fillColor('#f2140c')
  doc.text(`ATLET TERBAIK — ${event.nama.toUpperCase()}`, { align: 'center' })
  doc.moveDown(0.5)

  const bestWidths = [150, 120, 50, 50, 60, 50]
  const bestHeaders = ['Atlet', 'Tim', 'Emas', 'Perak', 'Perunggu', 'Total']

  const renderBestSection = (title: string, swimmers: Array<{ nama: string; teamNama: string; emas: number; perak: number; perunggu: number; total: number }>) => {
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#000')
    doc.text(title)
    doc.moveDown(0.3)
    doc.font('Helvetica-Bold').fontSize(9)
    let bx = doc.page.margins.left
    bestHeaders.forEach((h, i) => {
      doc.text(h, bx, doc.y, { width: bestWidths[i], align: 'center' })
      bx += bestWidths[i]
    })
    doc.moveDown(0.3)
    doc.font('Helvetica').fontSize(9)
    if (swimmers.length > 0) {
      swimmers.forEach((s) => {
        const browX = doc.page.margins.left
        doc.text(s.nama, browX, doc.y, { width: bestWidths[0] })
        doc.text(s.teamNama, browX + bestWidths[0], doc.y, { width: bestWidths[1] })
        doc.text(String(s.emas), browX + bestWidths[0] + bestWidths[1], doc.y, { width: bestWidths[2], align: 'center' })
        doc.text(String(s.perak), browX + bestWidths[0] + bestWidths[1] + bestWidths[2], doc.y, { width: bestWidths[3], align: 'center' })
        doc.text(String(s.perunggu), browX + bestWidths[0] + bestWidths[1] + bestWidths[2] + bestWidths[3], doc.y, { width: bestWidths[4], align: 'center' })
        doc.text(String(s.total), browX + bestWidths[0] + bestWidths[1] + bestWidths[2] + bestWidths[3] + bestWidths[4], doc.y, { width: bestWidths[5], align: 'center' })
        doc.moveDown(0.25)
      })
    } else {
      doc.font('Helvetica-Oblique').fontSize(9).fillColor('#666')
      doc.text('Belum ada data.', { align: 'center' })
      doc.moveDown(0.5)
    }
    doc.moveDown(0.8)
  }

  renderBestSection('Putra', bestSwimmerPutra)
  renderBestSection('Putri', bestSwimmerPutri)

  doc.end()
  return Buffer.concat(chunks)
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
  const doc = new PDFDocument({ size: 'A4', margin: 50 })
  const chunks: Buffer[] = []
  doc.on('data', (c: Buffer) => chunks.push(c))

  const teamsMap = new Map(teams.map((t) => [t.id, t.nama]))

  doc.font('Helvetica-Bold').fontSize(20).fillColor('#f2140c')
  doc.text('BUKU ACARA', { align: 'center' })
  doc.moveDown(0.5)
  doc.font('Helvetica').fontSize(12).fillColor('#000')
  doc.text(event.nama.toUpperCase(), { align: 'center' })
  doc.moveDown(0.5)
  const tgl = event.tanggal ? new Date(event.tanggal).toLocaleDateString('id-ID') : '-'
  doc.text(`${tgl} | ${event.lokasi || '-'}`, { align: 'center' })
  doc.moveDown(1.5)

  const headers = ['No Acara', 'Kategori', 'Jenis Kelamin', 'Sesi', 'Peserta', 'Tim']
  const widths = [60, 120, 100, 60, 140, 120]

  for (const cat of categories) {
    doc.font('Helvetica-Bold').fontSize(12)
    doc.text(`Acara ${cat.nomor_acara} — ${cat.gaya} ${cat.jenis_kelamin} (${cat.sesi})`)
    doc.moveDown(0.3)

    // Header row
    let hx = doc.page.margins.left
    doc.font('Helvetica-Bold').fontSize(8)
    headers.forEach((h, i) => {
      doc.text(h, hx, doc.y, { width: widths[i], align: 'center' })
      hx += widths[i]
    })
    doc.moveDown(0.3)

    const participants = participantsByCategory.get(cat.id) ?? []
    if (participants.length === 0) {
      doc.font('Helvetica-Oblique').fontSize(9).fillColor('#666')
      doc.text('Belum ada peserta terdaftar.')
      doc.moveDown(0.5)
      continue
    }

    doc.font('Helvetica').fontSize(8)
    for (const p of participants) {
      const rowX = doc.page.margins.left
      doc.text(cat.nomor_acara, rowX, doc.y, { width: widths[0], align: 'center' })
      doc.text(cat.gaya, rowX + widths[0], doc.y, { width: widths[1] })
      doc.text(cat.jenis_kelamin, rowX + widths[0] + widths[1], doc.y, { width: widths[2], align: 'center' })
      doc.text(cat.sesi, rowX + widths[0] + widths[1] + widths[2], doc.y, { width: widths[3], align: 'center' })
      doc.text(p.nama, rowX + widths[0] + widths[1] + widths[2] + widths[3], doc.y, { width: widths[4] })
      doc.text(p.team_nama ?? '-', rowX + widths[0] + widths[1] + widths[2] + widths[3] + widths[4], doc.y, { width: widths[5] })
      doc.moveDown(0.25)
    }
    doc.moveDown(0.5)

    if (doc.y > 700) {
      doc.addPage()
    }
  }

  doc.end()
  return Buffer.concat(chunks)
}
