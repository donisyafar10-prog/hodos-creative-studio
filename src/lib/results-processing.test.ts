import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  processCategoryResults,
  calculateMedals,
} from './results-processing'

describe('processCategoryResults', () => {
  it('sorts results ascending by time', () => {
    const results = processCategoryResults(
      [
        { id: 'p1', nama: 'A', teamId: 't1', teamNama: 'Tim A', waktuAkhir: '25,00', lane: 4, categoryId: 'c1', jenisKelamin: 'putra', isEstafet: false },
        { id: 'p2', nama: 'B', teamId: 't2', teamNama: 'Tim B', waktuAkhir: '20,00', lane: 5, categoryId: 'c1', jenisKelamin: 'putra', isEstafet: false },
        { id: 'p3', nama: 'C', teamId: 't1', teamNama: 'Tim A', waktuAkhir: '22,00', lane: 3, categoryId: 'c1', jenisKelamin: 'putra', isEstafet: false },
      ],
      null
    )

    assert.strictEqual(results[0].posisi, 1)
    assert.strictEqual(results[0].waktuAkhir, '20,00')
    assert.strictEqual(results[1].posisi, 2)
    assert.strictEqual(results[2].posisi, 3)
  })

  it('puts DNF at bottom with no position', () => {
    const results = processCategoryResults(
      [
        { id: 'p1', nama: 'Valid', teamId: 't1', teamNama: 'Tim A', waktuAkhir: '20,00', lane: 4, categoryId: 'c1', jenisKelamin: 'putra', isEstafet: false },
        { id: 'p2', nama: 'DNF Atlet', teamId: 't1', teamNama: 'Tim A', waktuAkhir: 'DNF', lane: 3, categoryId: 'c1', jenisKelamin: 'putra', isEstafet: false },
      ],
      null
    )

    const dnf = results.find((r) => r.nama === 'DNF Atlet')
    assert.strictEqual(dnf?.posisi, null)
    assert.strictEqual(dnf?.ket, 'DNF')

    const valid = results.filter((r) => r.posisi !== null)
    assert.strictEqual(valid.length, 1)
  })

  it('detects record when fastest beats record', () => {
    const results = processCategoryResults(
      [
        { id: 'p1', nama: 'Fast', teamId: 't1', teamNama: 'Tim A', waktuAkhir: '18,00', lane: 4, categoryId: 'c1', jenisKelamin: 'putra', isEstafet: false },
      ],
      { waktuRe: '20,00' }
    )

    assert.strictEqual(results[0].rekorFlag, true)
    assert.strictEqual(results[0].ket, 'R. Sultra')
    assert.strictEqual(results[0].posisi, 1)
  })

  it('does not flag record when slower', () => {
    const results = processCategoryResults(
      [
        { id: 'p1', nama: 'Slow', teamId: 't1', teamNama: 'Tim A', waktuAkhir: '22,00', lane: 4, categoryId: 'c1', jenisKelamin: 'putra', isEstafet: false },
      ],
      { waktuRe: '20,00' }
    )

    assert.strictEqual(results[0].rekorFlag, false)
    assert.strictEqual(results[0].ket, null)
  })
})

describe('calculateMedals', () => {
  const teams = [
    { id: 't1', nama: 'Tim A' },
    { id: 't2', nama: 'Tim B' },
    { id: 't3', nama: 'Tim C' },
  ]

  it('awards top 3 medals to teams', () => {
    const results = [
      { participantId: 'p1', posisi: 1, teamId: 't1', teamNama: 'Tim A', nama: 'A1', waktuAkhir: '20,00', ket: null, rekorFlag: false, jenisKelamin: 'putra', isEstafet: false, categoryId: 'c1', lane: 4 },
      { participantId: 'p2', posisi: 2, teamId: 't2', teamNama: 'Tim B', nama: 'A2', waktuAkhir: '21,00', ket: null, rekorFlag: false, jenisKelamin: 'putra', isEstafet: false, categoryId: 'c1', lane: 5 },
      { participantId: 'p3', posisi: 3, teamId: 't1', teamNama: 'Tim A', nama: 'A3', waktuAkhir: '22,00', ket: null, rekorFlag: false, jenisKelamin: 'putri', isEstafet: false, categoryId: 'c1', lane: 6 },
    ]

    const { teamMedals } = calculateMedals(results, teams)

    const timA = teamMedals.find((m) => m.teamId === 't1')
    assert.strictEqual(timA?.emas, 1)
    assert.strictEqual(timA?.perunggu, 1)
    assert.strictEqual(timA?.total, 2)

    const timB = teamMedals.find((m) => m.teamId === 't2')
    assert.strictEqual(timB?.perak, 1)
  })

  it('includes teams with 0 medals', () => {
    const results = [
      { participantId: 'p1', posisi: 1, teamId: 't1', teamNama: 'Tim A', nama: 'A1', waktuAkhir: '20,00', ket: null, rekorFlag: false, jenisKelamin: 'putra', isEstafet: false, categoryId: 'c1', lane: 4 },
    ]

    const { teamMedals } = calculateMedals(results, teams)

    const timC = teamMedals.find((m) => m.teamId === 't3')
    assert.ok(timC, 'Tim C should be included with 0 medals')
    assert.strictEqual(timC?.emas, 0)
    assert.strictEqual(timC?.total, 0)
  })

  it('sorts teams by medal count desc', () => {
    const results = [
      { participantId: 'p1', posisi: 1, teamId: 't2', teamNama: 'Tim B', nama: 'A1', waktuAkhir: '20,00', ket: null, rekorFlag: false, jenisKelamin: 'putra', isEstafet: false, categoryId: 'c1', lane: 4 },
      { participantId: 'p2', posisi: 1, teamId: 't1', teamNama: 'Tim A', nama: 'A2', waktuAkhir: '20,00', ket: null, rekorFlag: false, jenisKelamin: 'putra', isEstafet: false, categoryId: 'c1', lane: 5 },
      { participantId: 'p3', posisi: 2, teamId: 't2', teamNama: 'Tim B', nama: 'A3', waktuAkhir: '21,00', ket: null, rekorFlag: false, jenisKelamin: 'putra', isEstafet: false, categoryId: 'c1', lane: 6 },
    ]

    const { teamMedals } = calculateMedals(results, teams)

    assert.strictEqual(teamMedals[0].teamId, 't2') // 1 emas, 1 perak
    assert.strictEqual(teamMedals[1].teamId, 't1') // 1 emas
  })

  it('best swimmer separates by gender', () => {
    const results = [
      { participantId: 'p1', posisi: 1, teamId: 't1', teamNama: 'Tim A', nama: 'P1', waktuAkhir: '20,00', ket: null, rekorFlag: false, jenisKelamin: 'putra', isEstafet: false, categoryId: 'c1', lane: 4 },
      { participantId: 'p2', posisi: 1, teamId: 't1', teamNama: 'Tim A', nama: 'P2', waktuAkhir: '20,00', ket: null, rekorFlag: false, jenisKelamin: 'putri', isEstafet: false, categoryId: 'c1', lane: 5 },
    ]

    const { bestSwimmerPutra, bestSwimmerPutri } = calculateMedals(results, teams)

    assert.strictEqual(bestSwimmerPutra.length, 1)
    assert.strictEqual(bestSwimmerPutra[0].nama, 'P1')
    assert.strictEqual(bestSwimmerPutri.length, 1)
    assert.strictEqual(bestSwimmerPutri[0].nama, 'P2')
  })

  it('excludes estafet from best swimmer', () => {
    const results = [
      { participantId: 'p1', posisi: 1, teamId: 't1', teamNama: 'Tim A', nama: 'E1', waktuAkhir: '20,00', ket: null, rekorFlag: false, jenisKelamin: 'putra', isEstafet: true, categoryId: 'c1', lane: 4 },
    ]

    const { bestSwimmerPutra } = calculateMedals(results, teams)
    assert.strictEqual(bestSwimmerPutra.length, 0)
  })
})
