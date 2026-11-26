/**
 * Seed script untuk event "Kejurnas 2022" dari contoh format VBA
 * Jalankan: npx tsx scripts/seed-event.ts
 */
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Data dari contoh VBA
const eventData = {
  nama: 'Kejurnas 2022',
  tanggal: '2022-08-15',
  lokasi: 'Surabaya',
  status: 'finished' as const,
}

const categories = [
  {
    nomor_acara: '101',
    gaya: '50m Bifins',
    jenis_kelamin: 'putra' as const,
    sesi: 'sore' as const,
    urutan: 1,
  },
  // Bisa tambah kategori lain di sini
]

// Tim dari data
const teams = [
  'Wakatobi',
  'Sultra',
  'Kota Kendari',
  'Kab. Buton Selatan',
  'Kab. Konawe',
  'Kab. Konawe Selatan',
  'Kab. Kolaka',
  'Kab. Bombana',
  'Kab. Konawe Utara',
]

// Atlet per heat dari data VBA
const heatData = [
  // SERI 1
  [
    { lintasan: 2, nama: 'Ld. Ahmad Fikri', lahir: 1997, tim: 'Wakatobi' },
    { lintasan: 3, nama: 'Agus Salim', lahir: 1993, tim: 'Wakatobi' },
    { lintasan: 4, nama: 'Rangga Yudha', lahir: 2004, tim: 'Wakatobi' },
    { lintasan: 5, nama: 'Ghinand aditya nanda', lahir: 2012, tim: 'Kota Kendari' },
    { lintasan: 6, nama: 'Muh. Akmal', lahir: 1997, tim: 'Wakatobi' },
  ],
  // SERI 2
  [
    { lintasan: 1, nama: 'Ahmad Azhar', lahir: 2015, tim: 'Wakatobi' },
    { lintasan: 2, nama: 'Rizky Tawakkal Amrin', lahir: 2004, tim: 'Sultra' },
    { lintasan: 3, nama: 'Farhan nur raffy', lahir: 2005, tim: 'Kota Kendari' },
    { lintasan: 4, nama: 'Putu Yudha Arya Suputra', lahir: 2012, tim: 'Kota Kendari' },
    { lintasan: 5, nama: 'muh.fauzan dimas agustian', lahir: 2007, tim: 'Kota Kendari' },
    { lintasan: 6, nama: 'Rangga Prabowo R', lahir: 2015, tim: 'Kab. Buton Selatan' },
    { lintasan: 7, nama: 'Made Aditya Suputra', lahir: 2016, tim: 'Kota Kendari' },
    { lintasan: 8, nama: 'Dikki Bakri', lahir: 2005, tim: 'Kota Kendari' },
  ],
  // SERI 3
  [
    { lintasan: 1, nama: 'Pajran', lahir: 2012, tim: 'Kab. Konawe' },
    { lintasan: 2, nama: 'Muh. Dimas', lahir: 2009, tim: 'Kab. Konawe' },
    { lintasan: 3, nama: 'Muhammad Alvaro Gavriel', lahir: 2013, tim: 'Kab. Konawe Selatan' },
    { lintasan: 4, nama: 'Rijwady permana', lahir: 2005, tim: 'Kab. Konawe Selatan' },
    { lintasan: 5, nama: 'Muh Alfiansyah Annas Alsyafei', lahir: 2005, tim: 'Kab. Kolaka' },
    { lintasan: 6, nama: 'Muh. Ibnu S Taba', lahir: 2010, tim: 'Kab. Konawe' },
    { lintasan: 7, nama: 'Hendra', lahir: 2012, tim: 'Kab. Konawe' },
    { lintasan: 8, nama: 'Raihan Muhammad', lahir: 2015, tim: 'Kab. Buton Selatan' },
  ],
  // SERI 4
  [
    { lintasan: 1, nama: 'Arya Satya Radtiya', lahir: 2012, tim: 'Kab. Bombana' },
    { lintasan: 2, nama: 'Andrew prawira sembiring', lahir: 2008, tim: 'Kota Kendari' },
    { lintasan: 3, nama: 'Michael Christian Patalle', lahir: 2012, tim: 'Kab. Buton Selatan' },
    { lintasan: 4, nama: 'Muh. Ravi Wathaniah Syafar', lahir: 2002, tim: 'Kab. Kolaka' },
    { lintasan: 5, nama: 'Andi Ricky Pratama Imran L', lahir: 2012, tim: 'Kota Kendari' },
    { lintasan: 6, nama: 'Muhammad Adelio Rafi Dafira', lahir: 2009, tim: 'Kab. Konawe Selatan' },
    { lintasan: 7, nama: 'Ifath As-Syarif Ramadhan', lahir: 2014, tim: 'Kab. Konawe Utara' },
    { lintasan: 8, nama: 'Muh. Wahyu darmawan M', lahir: 1999, tim: 'Kab. Kolaka' },
  ],
  // SERI 5
  [
    { lintasan: 1, nama: 'Riskyansyah Ruslan', lahir: 1993, tim: 'Wakatobi' },
    { lintasan: 2, nama: 'Rehyan AZQA putra salman', lahir: 2013, tim: 'Kota Kendari' },
    { lintasan: 3, nama: 'Kevin ode natama', lahir: 1996, tim: 'Konawe utara' },
    { lintasan: 4, nama: 'Doni Syafar', lahir: 2001, tim: 'Sultra' },
    { lintasan: 5, nama: 'SAINS AL BANI INDONESIA', lahir: 2013, tim: 'Kota Kendari' },
    { lintasan: 6, nama: 'Arkana putra karaya', lahir: 2011, tim: 'Kota Kendari' },
    { lintasan: 7, nama: 'Ganesha Tular', lahir: 2011, tim: 'Kota Kendari' },
    { lintasan: 8, nama: 'MUHAMMAD AZRIEL', lahir: 2005, tim: 'Kab. Kolaka' },
  ],
]

// Record untuk kategori ini
const recordData = {
  kategori: '50m Bifins Putra',
  waktu_rekor: '00,20,48',
  atlet: 'Doni Syafar',
  kejuaraan: 'Kejurnas',
  tahun: 2022,
  tempat: 'Surabaya',
}

async function seed() {
  console.log('🌱 Starting seed...')

  // 1. Create event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert(eventData)
    .select()
    .single()

  if (eventError) {
    console.error('❌ Event error:', eventError)
    return
  }
  console.log('✅ Event created:', event.nama, event.id)

  // 2. Create teams
  const teamMap = new Map<string, string>()
  for (const teamNama of teams) {
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({ nama: teamNama, event_id: event.id })
      .select()
      .single()

    if (teamError) {
      console.error('❌ Team error:', teamError)
      return
    }
    teamMap.set(teamNama, team.id)
    console.log('✅ Team created:', team.nama, team.id)
  }

  // 3. Create category
  const { data: category, error: catError } = await supabase
    .from('event_categories')
    .insert({ ...categories[0], event_id: event.id })
    .select()
    .single()

  if (catError) {
    console.error('❌ Category error:', catError)
    return
  }
  console.log('✅ Category created:', category.gaya, category.id)

  // 4. Create heats
  const heatMap = new Map<number, string>()
  for (let i = 0; i < heatData.length; i++) {
    const { data: heat, error: heatError } = await supabase
      .from('heats')
      .insert({ event_category_id: category.id, nomor_heat: i + 1 })
      .select()
      .single()

    if (heatError) {
      console.error('❌ Heat error:', heatError)
      return
    }
    heatMap.set(i + 1, heat.id)
    console.log('✅ Heat created:', `Seri ${i + 1}`, heat.id)
  }

  // 5. Create participants and heat_lanes
  for (let heatIdx = 0; heatIdx < heatData.length; heatIdx++) {
    const heatId = heatMap.get(heatIdx + 1)!
    const swimmers = heatData[heatIdx]

    for (const s of swimmers) {
      // Create participant
      const teamId = teamMap.get(s.tim)
      if (!teamId) {
        console.warn('⚠️ Team not found:', s.tim)
        continue
      }

      const { data: participant, error: pError } = await supabase
        .from('participants')
        .insert({
          nama: s.nama,
          tahun_lahir: s.lahir,
          gender: 'putra',
          team_id: teamId,
          event_category_id: category.id,
        })
        .select()
        .single()

      if (pError) {
        console.error('❌ Participant error:', pError)
        return
      }

      // Create heat_lane
      const { error: hlError } = await supabase
        .from('heat_lanes')
        .insert({
          heat_id: heatId,
          nomor_lintasan: s.lintasan,
          participant_id: participant.id,
          waktu_prestasi: null,
        })

      if (hlError) {
        console.error('❌ Heat lane error:', hlError)
        return
      }

      console.log(`✅ ${s.nama} (Lintasan ${s.lintasan}) -> Seri ${heatIdx + 1}`)
    }
  }

  // 6. Create record
  const { error: recError } = await supabase.from('records').upsert(recordData)
  if (recError) {
    console.error('❌ Record error:', recError)
    return
  }
  console.log('✅ Record created:', recordData.kategori, recordData.waktu_rekor)

  console.log('🎉 Seed completed successfully!')
}

seed().catch(console.error)