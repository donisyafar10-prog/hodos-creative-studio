'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface Category {
  id: string
  nomor_acara: string
  gaya: string
  jenis_kelamin: string
  sesi: string
  events: { nama: string }
}

interface HeatLane {
  id: string
  nomor_lintasan: number
  participants: {
    id: string
    nama: string
  } | null
  waktu_prestasi: string | null
}

interface Heat {
  id: string
  nomor_heat: number
  heat_lanes: HeatLane[]
}

type TimeStatus = '' | 'DNF' | 'DNS' | 'DQ'

function isValidTimeInput(value: string): boolean {
  if (!value) return true
  const upper = value.toUpperCase()
  if (upper === 'DNF' || upper === 'DNS' || upper === 'DQ') return true
  // Format: angka, koma, titik (e.g. 16,10 or 1,16,10)
  return /^[\d.,:]+$/.test(value)
}

export default function WasitTimeInput({
  category,
  heats,
}: {
  category: Category
  heats: Heat[]
}) {
  const router = useRouter()
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<Set<string>>(new Set())
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => setStatus(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [status])

  const handleChange = (laneId: string, value: string) => {
    if (!isValidTimeInput(value)) return
    setInputs((prev) => ({ ...prev, [laneId]: value.toUpperCase() }))
  }

  const handleQuickSet = (laneId: string, statusVal: TimeStatus) => {
    setInputs((prev) => ({ ...prev, [laneId]: statusVal }))
  }

  const handleSave = async (laneId: string, value: string) => {
    const savingSet = Array.from(saving)
    savingSet.push(laneId)
    setSaving(new Set(savingSet))
    setStatus(null)

    try {
      const res = await fetch('/api/wasit/result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heatLaneId: laneId, waktu: value }),
      })

      if (res.ok) {
        setStatus({ message: 'Waktu tersimpan', type: 'success' })
      } else {
        const err = await res.json()
        setStatus({ message: err.error ?? 'Gagal menyimpan', type: 'error' })
      }
    } catch {
      setStatus({ message: 'Terjadi kesalahan jaringan', type: 'error' })
    } finally {
      setSaving((prev) => {
        const next = new Set(prev)
        next.delete(laneId)
        return next
      })
    }
  }

  const handleBlur = (laneId: string) => {
    const value = inputs[laneId]
    if (value && value.trim()) {
      handleSave(laneId, value)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-anton text-3xl mb-1 uppercase">
            Input Waktu Wasit
          </h1>
          <p className="text-sm text-muted-foreground">
            Acara {category.nomor_acara}: {category.gaya} {category.jenis_kelamin} ({category.sesi})
          </p>
        </div>
        <Button onClick={() => router.back()} variant="outline">
          Kembali
        </Button>
      </div>

      {status && (
        <div
          className={`p-3 rounded text-sm font-medium ${
            status.type === 'success'
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}
        >
          {status.message}
        </div>
      )}

      {heats.length === 0 ? (
        <div className="border border-border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">Belum ada heat yang diatur untuk kategori ini.</p>
          <p className="text-xs text-muted-foreground mt-2">
            Silakan atur heat & lintasan melalui admin panel terlebih dahulu.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted text-muted-foreground sticky top-0 z-10">
                <th className="p-3 border border-border text-sm font-semibold w-20">Lintasan</th>
                <th className="p-3 border border-border text-sm font-semibold">Atlet</th>
                <th className="p-3 border border-border text-sm font-semibold">Tim</th>
                <th className="p-3 border border-border text-sm font-semibold text-center">Waktu Akhir</th>
                <th className="p-3 border border-border text-sm font-semibold text-center">Cepat Set</th>
              </tr>
            </thead>
            <tbody>
              {heats.flatMap((heat) =>
                heat.heat_lanes.map((lane) => (
                  <tr key={lane.id} className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 border-r border-border font-mono text-sm font-medium">
                      L{lane.nomor_lintasan}
                    </td>
                    <td className="p-3 border-r border-border">
                      {lane.participants?.nama ?? 'Kosong'}
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {'-'}
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="text"
                        value={inputs[lane.id] ?? lane.waktu_prestasi ?? ''}
                        onChange={(e) => handleChange(lane.id, e.target.value)}
                        onBlur={() => handleBlur(lane.id)}
                        placeholder="99,99,99"
                        className="w-full text-center text-sm border-b border-helix-bg focus:border-helix-bg focus:outline-none transition-colors"
                        inputMode="text"
                        spellCheck={false}
                        disabled={saving.has(lane.id)}
                      />
                      {saving.has(lane.id) && (
                        <span className="text-xs text-muted-foreground block mt-1">Menyimpan...</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex gap-1 justify-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            handleQuickSet(lane.id, 'DNF')
                            handleSave(lane.id, 'DNF')
                          }}
                          disabled={saving.has(lane.id)}
                        >
                          DNF
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            handleQuickSet(lane.id, 'DNS')
                            handleSave(lane.id, 'DNS')
                          }}
                          disabled={saving.has(lane.id)}
                        >
                          DNS
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            handleQuickSet(lane.id, 'DQ')
                            handleSave(lane.id, 'DQ')
                          }}
                          disabled={saving.has(lane.id)}
                        >
                          DQ
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}