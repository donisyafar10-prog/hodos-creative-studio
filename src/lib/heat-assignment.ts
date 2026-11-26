/**
 * Heat & Lane Assignment Logic — ported from Excel VBA
 * - ParseWaktuToSeconds (VBA: ParseWaktuToSeconds / KonversiWaktuKeDetik)
 * - FINA lane order: 4, 5, 3, 6, 2, 7, 1, 8 (center-out)
 * - Fastest swimmers go to LAST heat; leftovers go to heat 1
 */

export type ParsedTime = {
  seconds: number
  display: string
  isDNF: boolean
  isDNS: boolean
  isDQ: boolean
  isInvalid: boolean
}

/**
 * Parse waktu teks ke detik (port dari VBA ParseWaktuToSeconds).
 * Format yang didukung: "16,10", "1.16,10", "1:16,10", "99.99.99", "DNF", "DNS", "DQ", "-", ""
 */
export function parseWaktuToSeconds(waktuStr: string): ParsedTime {
  if (!waktuStr) {
    return { seconds: 999999, display: '', isDNF: false, isDNS: false, isDQ: false, isInvalid: true }
  }

  const clean = waktuStr.trim()
  const upper = clean.toUpperCase()

  // Status khusus -> 999998 (di bawah tapi di atas sel kosong)
  if (upper.includes('DNF') || upper.includes('DNS') || upper.includes('DQ')) {
    return {
      seconds: 999998,
      display: upper,
      isDNF: upper.includes('DNF'),
      isDNS: upper.includes('DNS'),
      isDQ: upper.includes('DQ'),
      isInvalid: false,
    }
  }

  if (
    clean === '' ||
    clean === '99.99.99' ||
    clean === '99,99,99' ||
    clean === '-' ||
    clean === '0'
  ) {
    return { seconds: 999999, display: clean, isDNF: false, isDNS: false, isDQ: false, isInvalid: true }
  }

  // Standardisasi pemisah: titik, koma, titik dua -> koma
  let std = clean.replace(/:/g, ',').replace(/\./g, ',')
  const parts = std.split(',')

  let totalSec = 0

  switch (parts.length) {
    case 1: // Hanya detik
      totalSec = Number(parts[0]) || 0
      break
    case 2: // Detik dan milidetik (16,10 -> 16.10)
      totalSec = Number(`${parts[0]}.${parts[1]}`) || 0
      break
    case 3: // Menit, Detik, Milidetik (1,16,10 -> 1 menit 16.10)
      totalSec = Number(parts[0]) * 60 + Number(`${parts[1]}.${parts[2]}`) || 0
      break
    case 4: // Jam, Menit, Detik, Milidetik
      totalSec = Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(`${parts[2]}.${parts[3]}`) || 0
      break
    default:
      totalSec = 999999
  }

  return {
    seconds: totalSec,
    display: clean,
    isDNF: false,
    isDNS: false,
    isDQ: false,
    isInvalid: totalSec === 999999,
  }
}

export function formatSecondsToDisplay(seconds: number): string {
  if (seconds >= 999998) return ''
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  const ms = Math.round((s - Math.floor(s)) * 100)
  const sec = Math.floor(s)
  const msStr = ms.toString().padStart(2, '0')
  if (m > 0) {
    return `${m},${sec.toString().padStart(2, '0')},${msStr}`
  }
  return `${sec},${msStr}`
}

/** FINA standard lane order: center-out (4, 5, 3, 6, 2, 7, 1, 8) */
export const FINA_LANE_ORDER = [4, 5, 3, 6, 2, 7, 1, 8]

export type HeatAssignment = {
  participantId: string
  heat: number
  lane: number
}

export type ParticipantWithTime = {
  id: string
  nama: string
  waktu_prestasi: string
  team?: string | null
}

/**
 * Assign heats and lanes per FINA rules.
 *
 * Algorithm (port from VBA AturSeriDanLintasanOtomatis):
 * 1. Parse all waktu_prestasi to seconds
 * 2. Sort ascending (fastest first), DNF/DNS/DQ at bottom (999998), invalid/empty last (999999)
 * 3. Total heats = ceil(n / 8)
 * 4. Fastest swimmers go to LAST heat; remainder goes to heat 1
 * 5. Each heat filled using FINA_LANE_ORDER
 * 6. Leftover (< 8) goes to heat 1
 */
export function assignHeatsAndLanes(
  participants: ParticipantWithTime[],
  lanesPerHeat = 8
): { totalHeats: number; assignments: HeatAssignment[]; sorted: { id: string; seconds: number }[] } {
  const n = participants.length
  if (n === 0) return { totalHeats: 0, assignments: [], sorted: [] }

  // 1. Parse & tag with seconds
  const withSeconds = participants.map((p) => ({
    ...p,
    seconds: parseWaktuToSeconds(p.waktu_prestasi).seconds,
  }))

  // 2. Sort ascending (fastest first)
  withSeconds.sort((a, b) => a.seconds - b.seconds)

  // 3. Total heats
  const totalHeats = Math.ceil(n / lanesPerHeat)

  // 4. Remainder for heat 1 (leftover), rest = 8 per heat
  let remainder = n % lanesPerHeat
  if (remainder === 0) remainder = lanesPerHeat

  // 5. Fill from LAST heat backward to heat 1
  //    Fastest swimmers go to last heat
  const assignments: HeatAssignment[] = []
  let pointer = 0 // starts at fastest (index 0)

  for (let h = totalHeats; h >= 1; h--) {
    const countInHeat = h === 1 ? remainder : lanesPerHeat

    for (let slot = 0; slot < countInHeat; slot++) {
      if (pointer >= n) break
      const lane = FINA_LANE_ORDER[slot] // center-out
      assignments.push({
        participantId: withSeconds[pointer].id,
        heat: h,
        lane,
      })
      pointer++
    }
  }

  const sorted = withSeconds.map((p) => ({ id: p.id, seconds: p.seconds }))

  return { totalHeats, assignments, sorted }
}
