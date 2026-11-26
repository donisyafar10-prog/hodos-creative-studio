import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import ExcelJS from 'exceljs'

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

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Hodos Creative Studio'
  workbook.title = `Buku Acara - ${event.nama}`

  const sheet = workbook.addWorksheet('Buku Acara')

  // Header info
  sheet.mergeCells('A1:F1')
  const titleCell = sheet.getCell('A1')
  titleCell.value = `BUKU ACARA — ${event.nama.toUpperCase()}`
  titleCell.font = { size: 16, bold: true, name: 'Anton' }
  titleCell.alignment = { horizontal: 'center' }

  sheet.mergeCells('A2:F2')
  const subtitleCell = sheet.getCell('A2')
  subtitleCell.value = `${event.tanggal ? new Date(event.tanggal).toLocaleDateString('id-ID') : '-'} | ${event.lokasi || '-'}`
  subtitleCell.alignment = { horizontal: 'center' }

  const headerRow = sheet.addRow([
    'No Acara',
    'Kategori',
    'Jenis Kelamin',
    'Sesi',
    'Peserta',
    'Tim',
  ])
  headerRow.font = { bold: true }
  headerRow.eachCell((cell) => {
    cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
    cell.alignment = { horizontal: 'center' }
  })

  let rowNum = 4

  for (const cat of categories ?? []) {
    const { data: participants } = await supabase
      .from('participants')
      .select('id, nama, teams(nama)')
      .eq('event_category_id', cat.id)
      .order('nama', { ascending: true })

    // Category title row
    sheet.mergeCells(`A${rowNum}:F${rowNum}`)
    const catCell = sheet.getCell(`A${rowNum}`)
    catCell.value = `Acara ${cat.nomor_acara} — ${cat.gaya} ${cat.jenis_kelamin} (${cat.sesi})`
    catCell.font = { bold: true, size: 12, name: 'Anton' }
    catCell.alignment = { horizontal: 'left' }
    rowNum++

    if (!participants || participants.length === 0) {
      sheet.mergeCells(`A${rowNum}:F${rowNum}`)
      const emptyCell = sheet.getCell(`A${rowNum}`)
      emptyCell.value = 'Belum ada peserta terdaftar.'
      emptyCell.font = { italic: true, size: 10, color: { argb: 'FF666666' } }
      rowNum += 2
      continue
    }

    for (const p of participants) {
      const teamNama = (p as any).teams?.nama ?? '-'
      sheet.addRow([
        cat.nomor_acara,
        cat.gaya,
        cat.jenis_kelamin,
        cat.sesi,
        p.nama,
        teamNama,
      ])
      rowNum++
    }

    rowNum++ // blank row between categories
  }

  sheet.getColumn('A').width = 14
  sheet.getColumn('B').width = 22
  sheet.getColumn('C').width = 16
  sheet.getColumn('D').width = 12
  sheet.getColumn('E').width = 26
  sheet.getColumn('F').width = 22

  const buffer = await workbook.xlsx.writeBuffer()

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Buku Acara - ${event.nama}.xlsx"`,
    },
  })
}
