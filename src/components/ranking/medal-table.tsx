import { createServerClient } from '@/lib/supabase/server'

interface TeamMedal {
  nama: string
  emas: number
  perak: number
  perunggu: number
}

export default async function MedalTable() {
  const supabase = createServerClient()

  const { data: medals } = await supabase
    .from('medals')
    .select('*, teams(nama)')
    .order('emas', { ascending: false })
    .order('perak', { ascending: false })
    .order('perunggu', { ascending: false })

  const rows: TeamMedal[] = (medals ?? []).map((m) => ({
    nama: (m.teams as any)?.nama ?? 'Tim Tidak Dikenal',
    emas: Number(m.emas) || 0,
    perak: Number(m.perak) || 0,
    perunggu: Number(m.perunggu) || 0,
  }))

  return (
    <section className="mb-12">
      <h2 className="font-anton text-2xl mb-4 uppercase">Perolehan Medali Tim</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted text-muted-foreground">
              <th className="p-3 border border-border text-sm font-semibold">Peringkat</th>
              <th className="p-3 border border-border text-sm font-semibold">Tim</th>
              <th className="p-3 border border-border text-sm font-semibold text-center">Emas</th>
              <th className="p-3 border border-border text-sm font-semibold text-center">Perak</th>
              <th className="p-3 border border-border text-sm font-semibold text-center">Perunggu</th>
              <th className="p-3 border border-border text-sm font-semibold text-center">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.nama} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                <td className="p-3 border border-border font-bold">{i + 1}</td>
                <td className="p-3 border border-border">{row.nama}</td>
                <td className="p-3 border border-border text-center">{row.emas}</td>
                <td className="p-3 border border-border text-center">{row.perak}</td>
                <td className="p-3 border border-border text-center">{row.perunggu}</td>
                <td className="p-3 border border-border text-center font-bold">
                  {row.emas + row.perak + row.perunggu}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-3 border border-border text-center text-muted-foreground">
                  Belum ada data medali.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
