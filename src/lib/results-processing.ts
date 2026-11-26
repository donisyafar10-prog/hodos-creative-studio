/**
 * Results Processing Logic — ported from Excel VBA
 * - UrutkanJuaraBukuHasil: sort results, record detection
 * - RekapMedaliOtomatis: team medal recap + best swimmer
 */

import { parseWaktuToSeconds } from './heat-assignment'

export type ProcessedResult = {
  participantId: string
  nama: string
  teamId: string | null
  teamNama: string | null
  waktuAkhir: string
  posisi: number | null
  ket: string | null
  rekorFlag: boolean
  lane: number
  categoryId: string
  jenisKelamin: string
  isEstafet: boolean
}

export type MedalUpdate = {
  teamId: string
  teamNama: string
  emas: number
  perak: number
  perunggu: number
  total: number
}

export type BestSwimmerUpdate = {
  nama: string
  teamNama: string
  jenisKelamin: string
  emas: number
  perak: number
  perunggu: number
  total: number
}

export type ProcessResultOutput = {
  results: ProcessedResult[]
  medals: MedalUpdate[]
  bestSwimmerPutra: BestSwimmerUpdate[]
  bestSwimmerPutri: BestSwimmerUpdate[]
}

/**
 * Parse and sort results per category (port from VBA UrutkanJuaraBukuHasil).
 * - Sort ascending by waktu_akhir (fastest first)
 * - DNF/DNS/DQ (999998) at bottom
 * - Empty/invalid (999999) last
 * - Assign positions 1..n
 * - Record detection: position 1 with waktu < record → rekor_flag = true, ket = 'R. Sultra'
 */
export function processCategoryResults(
  participants: Array<{
    id: string
    nama: string
    teamId: string | null
    teamNama: string | null
    waktuAkhir: string | null
    lane: number
    categoryId: string
    jenisKelamin: string
    isEstafet: boolean
  }>,
  record: { waktuRe: string } | null
): ProcessedResult[] {
  const rows = participants.map((p) => {
    const parsed = p.waktuAkhir
      ? parseWaktuToSeconds(p.waktuAkhir)
      : { seconds: 999999, display: '', isDNF: false, isDNS: false, isDQ: false, isInvalid: true }

    const isDNF = parsed.isDNF || parsed.isDNS || parsed.isDQ
    return {
      ...p,
      seconds: parsed.seconds,
      isDNF,
      isInvalid: parsed.isInvalid,
    }
  })

  // Sort ascending: valid times first (fastest first), then DNF/DNS/DQ, then empty/invalid
  rows.sort((a, b) => {
    if (a.isInvalid && b.isInvalid) return 0
    if (a.isInvalid) return 1
    if (b.isInvalid) return -1
    if (a.isDNF && b.isDNF) return 0
    if (a.isDNF) return 1
    if (b.isDNF) return -1
    return a.seconds - b.seconds
  })

  const recordSeconds = record
    ? parseWaktuToSeconds(record.waktuRe).seconds
    : null

  let position = 0
  const results: ProcessedResult[] = rows.map((row) => {
    let pos: number | null = null
    let ket: string | null = null

    if (!row.isInvalid && !row.isDNF) {
      position++
      pos = position

      // Record detection
      let isRecord = false
      if (
        position === 1 &&
        recordSeconds &&
        recordSeconds > 0 &&
        recordSeconds < 999998 &&
        row.seconds < recordSeconds
      ) {
        isRecord = true
        ket = 'R. Sultra'
      }

      return {
        participantId: row.id,
        nama: row.nama,
        teamId: row.teamId,
        teamNama: row.teamNama,
        waktuAkhir: row.waktuAkhir ?? '',
        posisi: pos,
        ket,
        rekorFlag: isRecord,
        lane: row.lane,
        categoryId: row.categoryId,
        jenisKelamin: row.jenisKelamin,
        isEstafet: row.isEstafet,
      }
    }

    return {
      participantId: row.id,
      nama: row.nama,
      teamId: row.teamId,
      teamNama: row.teamNama,
      waktuAkhir: row.waktuAkhir ?? '',
      posisi: null,
      ket: row.isDNF ? 'DNF' : null,
      rekorFlag: false,
      lane: row.lane,
      categoryId: row.categoryId,
      jenisKelamin: row.jenisKelamin,
      isEstafet: row.isEstafet,
    }
  })

  return results
}

/**
 * Calculate team medals and best swimmer (port from VBA RekapMedaliOtomatis).
 * - Top 3 positions get emas/perak/perunggu (skip DNF/DNS/DQ)
 * - Include all teams (even 0 medals), sorted by emas > perak > perunggu > nama
 * - Best swimmer: individual events only (not estafet), per gender
 */
export function calculateMedals(
  allResults: ProcessedResult[],
  teams: Array<{ id: string; nama: string }>
): {
  teamMedals: MedalUpdate[]
  bestSwimmerPutra: BestSwimmerUpdate[]
  bestSwimmerPutri: BestSwimmerUpdate[]
} {
  // Team medal accumulation
  const teamMedalMap = new Map<string, MedalUpdate>()
  teams.forEach((t) => {
    teamMedalMap.set(t.id, { teamId: t.id, teamNama: t.nama, emas: 0, perak: 0, perunggu: 0, total: 0 })
  })

  // Best swimmer accumulation (key = nama|team|gender)
  const bestSwimmerMap = new Map<string, BestSwimmerUpdate>()

  // Get results with positions 1-3, sorted by position
  const podium = allResults
    .filter((r) => r.posisi !== null && r.posisi >= 1 && r.posisi <= 3)
    .sort((a, b) => (a.posisi ?? 999) - (b.posisi ?? 999))

  for (const result of podium) {
    const rank = result.posisi!

    // Team medals
    if (result.teamId && teamMedalMap.has(result.teamId)) {
      const tm = teamMedalMap.get(result.teamId)!
      if (rank === 1) tm.emas++
      if (rank === 2) tm.perak++
      if (rank === 3) tm.perunggu++
      tm.total = tm.emas + tm.perak + tm.perunggu
    }

    // Best swimmer (individual only, not estafet)
    if (!result.isEstafet && result.teamId) {
      const key = `${result.nama}|${result.teamId}|${result.jenisKelamin}`
      let swimmer = bestSwimmerMap.get(key)
      if (!swimmer) {
        swimmer = {
          nama: result.nama,
          teamNama: result.teamNama ?? '',
          jenisKelamin: result.jenisKelamin,
          emas: 0,
          perak: 0,
          perunggu: 0,
          total: 0,
        }
        bestSwimmerMap.set(key, swimmer)
      }
      if (rank === 1) swimmer.emas++
      if (rank === 2) swimmer.perak++
      if (rank === 3) swimmer.perunggu++
      swimmer.total = swimmer.emas + swimmer.perak + swimmer.perunggu
    }
  }

  const teamMedals = Array.from(teamMedalMap.values()).sort((a, b) => {
    if (b.emas !== a.emas) return b.emas - a.emas
    if (b.perak !== a.perak) return b.perak - a.perak
    if (b.perunggu !== a.perunggu) return b.perunggu - a.perunggu
    return a.teamNama.localeCompare(b.teamNama)
  })

  const bestSwimmerAll = Array.from(bestSwimmerMap.values()).sort((a, b) => {
    if (b.emas !== a.emas) return b.emas - a.emas
    if (b.perak !== a.perak) return b.perak - a.perak
    if (b.perunggu !== a.perunggu) return b.perunggu - a.perunggu
    return a.nama.localeCompare(b.nama)
  })

  const bestSwimmerPutra = bestSwimmerAll.filter((s) => s.jenisKelamin === 'putra')
  const bestSwimmerPutri = bestSwimmerAll.filter((s) => s.jenisKelamin === 'putri')

  return {
    teamMedals,
    bestSwimmerPutra,
    bestSwimmerPutri,
  }
}
