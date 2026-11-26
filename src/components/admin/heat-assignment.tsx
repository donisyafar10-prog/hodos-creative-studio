'use client'

import { useState } from 'react'
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

interface Participant {
  id: string
  nama: string
  waktu_prestasi: string | null
}

interface HeatLane {
  id: string
  nomor_lintasan: number
  participants: Participant | null
  waktu_prestasi: string | null
}

interface Heat {
  id: string
  nomor_heat: number
  heat_lanes: HeatLane[]
}

export default function HeatAssignmentPage({
  category,
  participants,
  heats,
}: {
  category: Category
  participants: Participant[]
  heats: Heat[]
}) {
  const router = useRouter()
  const [assigned, setAssigned] = useState(false)

  const hasAssignments = heats.length > 0
  const FINA_ORDER = [4, 5, 3, 6, 2, 7, 1, 8]

  const getLaneData = (heat: Heat, lane: number) =>
    heat.heat_lanes.find((l) => l.nomor_lintasan === lane)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-anton text-4xl uppercase">Atur Heat & Lintasan</h1>
          <p className="text-muted-foreground">
            Acara {category.nomor_acara}: {category.gaya} {category.jenis_kelamin} ({category.sesi})
          </p>
        </div>
        <Button onClick={() => router.back()} variant="outline">
          Kembali
        </Button>
      </div>

      {participants.length === 0 ? (
        <div className="border border-border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">Belum ada peserta terdaftar untuk kategori ini.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {!assigned && !hasAssignments ? (
            <>
              <div className="bg-muted/50 rounded-lg p-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Total peserta: <strong>{participants.length}</strong>. Sistem akan otomatis menentukan heat dan lintasan sesuai aturan FINA.
                </p>
                <Button
                  className="bg-helix-bg text-helix-fg"
                  onClick={async () => {
                    const res = await fetch('/api/admin/heats/assign', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ categoryId: category.id }),
                    })
                    if (res.ok) {
                      setAssigned(true)
                      router.refresh()
                    }
                  }}
                >
                  Atur Heat & Lintasan Otomatis
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted text-muted-foreground">
                      <th className="p-3 border border-border text-sm font-semibold">Heat</th>
                      <th className="p-3 border border-border text-sm font-semibold" colSpan={8}>
                        Lintasan
                      </th>
                    </tr>
                    <tr className="bg-muted text-muted-foreground">
                      <th className="p-3 border border-border text-sm font-semibold"></th>
                      {FINA_ORDER.map((lane) => (
                        <th key={lane} className="p-3 border border-border text-sm font-semibold text-center">
                          L{lane}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {heats.map((heat) => (
                      <tr key={heat.id} className="hover:bg-muted/50">
                        <td className="p-3 border border-border font-medium">
                          Heat {heat.nomor_heat}
                        </td>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((lane) => {
                          const laneData = getLaneData(heat, lane)
                          return (
                            <td key={lane} className="p-3 border border-border text-center h-24">
                              {laneData ? (
                                <>
                                  <div className="text-sm font-medium">
                                    {laneData.participants?.nama ?? 'Kosong'}
                                  </div>
                                  {laneData.participants?.waktu_prestasi ? (
                                    <div className="text-xs text-muted-foreground">
                                      {laneData.participants.waktu_prestasi}
                                    </div>
                                  ) : null}
                                </>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button onClick={() => router.back()} variant="outline">
                Selesai
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
