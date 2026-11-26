'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Participant {
  id: string
  nama: string
  team_id: string | null
  teams?: { nama: string } | null
}

interface Lane {
  id: string
  heat_id: string
  nomor_lintasan: number
  participant_id: string | null
  waktu_prestasi: string | null
  participant: Participant | null
}

interface Heat {
  id: string
  nomor_heat: number
  lanes: Lane[]
}

interface Category {
  id: string
  nomor_acara: string
  gaya: string
  jenis_kelamin: string
  sesi: string
}

interface WasitTimeInputProps {
  eventId: string
  categoryId: string
  category: Category
  heats: Heat[]
}

export default function WasitTimeInput({ eventId, categoryId, category, heats }: WasitTimeInputProps) {
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [times, setTimes] = useState<Record<string, string>>({})

  const handleTimeChange = (laneId: string, value: string) => {
    setTimes((prev) => ({ ...prev, [laneId]: value }))
  }

  const handleSave = async (laneId: string, waktu: string) => {
    setSaving(laneId)
    try {
      const res = await fetch(`/api/wasit/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          categoryId,
          laneId,
          waktu_prestasi: waktu,
        }),
      })
      if (res.ok) {
        setSaved(laneId)
        setTimeout(() => setSaved(null), 2000)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(null)
    }
  }

  const formatTime = (waktu: string | null) => {
    if (!waktu) return ''
    // Format MM:SS:cc -> MM,SS,cc untuk display
    return waktu.replace(/:/g, ',')
  }

  const parseTime = (waktu: string) => {
    // Parse MM,SS,cc -> MM:SS:cc untuk save
    return waktu.replace(/,/g, ':')
  }

  if (heats.length === 0) {
    return (
      <div className="border border-border rounded-lg p-12 text-center text-muted-foreground">
        Belum ada heat untuk kategori ini.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {heats.map((heat) => (
        <section key={heat.id} className="border border-border rounded-lg overflow-hidden">
          <div className="bg-muted px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="font-anton text-xl uppercase">Seri {heat.nomor_heat}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground">
                  <th className="p-3 border border-border text-sm font-semibold w-16">Lintasan</th>
                  <th className="p-3 border border-border text-sm font-semibold">Nama Atlet</th>
                  <th className="p-3 border border-border text-sm font-semibold w-48">Tim</th>
                  <th className="p-3 border border-border text-sm font-semibold w-40">Waktu (MM,SS,cc)</th>
                  <th className="p-3 border border-border text-sm font-semibold w-32">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {heat.lanes.map((lane) => (
                  <tr key={lane.id} className="hover:bg-muted/50">
                    <td className="p-3 border border-border font-medium text-center">
                      {lane.nomor_lintasan}
                    </td>
                    <td className="p-3 border border-border">
                      {lane.participant ? (
                        <span className="font-medium">{lane.participant.nama}</span>
                      ) : (
                        <span className="text-muted-foreground italic">— Kosong —</span>
                      )}
                    </td>
                    <td className="p-3 border border-border text-sm text-muted-foreground">
                      {lane.participant?.teams?.nama ?? '-'}
                    </td>
                    <td className="p-3 border border-border">
                      <input
                        type="text"
                        value={times[lane.id] ?? formatTime(lane.waktu_prestasi)}
                        onChange={(e) => handleTimeChange(lane.id, e.target.value)}
                        placeholder="MM,SS,cc"
                        disabled={!lane.participant || saving === lane.id}
                        className={cn(
                          'w-full px-3 py-2 bg-background border border-input rounded text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-ring',
                          !lane.participant && 'opacity-50 cursor-not-allowed'
                        )}
                      />
                    </td>
                    <td className="p-3 border border-border">
                      {lane.participant && (
                        <button
                          onClick={() => {
                            const waktu = times[lane.id] ?? formatTime(lane.waktu_prestasi)
                            if (waktu) handleSave(lane.id, parseTime(waktu))
                          }}
                          disabled={saving === lane.id || !times[lane.id] && !lane.waktu_prestasi}
                          className={cn(
                            'px-3 py-1 text-xs rounded transition-colors w-full',
                            saving === lane.id
                              ? 'bg-yellow-100 text-yellow-800 cursor-wait'
                              : saved === lane.id
                              ? 'bg-green-100 text-green-800'
                              : 'bg-helix-bg text-helix-fg hover:bg-helix-bg/90'
                          )}
                        >
                          {saving === lane.id
                            ? 'Menyimpan...'
                            : saved === lane.id
                            ? 'Tersimpan ✓'
                            : lane.waktu_prestasi
                            ? 'Update'
                            : 'Simpan'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  )
}