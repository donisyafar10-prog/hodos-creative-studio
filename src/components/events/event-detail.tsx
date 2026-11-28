import Link from 'next/link'

interface Event {
  id: string
  nama: string
  tanggal: string | null
  lokasi: string | null
  status: string
}

interface Category {
  id: string
  nomor_acara: string
  gaya: string
  jenis_kelamin: string
  sesi: string
  urutan: number
}

interface Participant {
  id: string
  nama: string
  tahun_lahir: number | null
  team_nama: string | null
}

export default function EventDetail({
  event,
  categories,
  participantsByCategory,
}: {
  event: Event
  categories: Category[]
  participantsByCategory: Record<string, Participant[]>
}) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-anton text-4xl mb-2 uppercase">{event.nama}</h1>
          <p className="text-muted-foreground">
            {event.tanggal ? new Date(event.tanggal).toLocaleDateString('id-ID') : '-'} &nbsp;|&nbsp;
            {event.lokasi || '-'}
          </p>
        </div>
        <Link href="/events" className="text-sm underline underline-offset-4">
          ← Kembali ke daftar
        </Link>
      </div>

      <div className="border border-border rounded-lg p-4 mb-6">
        <h2 className="text-2xl font-bold mb-4 uppercase">Buku Acara</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Semua kategori acara dalam satu halaman. Silakan scroll untuk melihat seluruh peserta.
        </p>

        {categories.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Belum ada kategori acara yang ditambahkan.</p>
        ) : (
          <>
            {categories.map((cat) => {
              const participants = participantsByCategory[cat.id] ?? []
              return (
                <section key={cat.id} className="border-b border-border pb-8 last:border-0 mb-8 last:mb-0">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-anton text-2xl mb-1 uppercase">
                        Acara {cat.nomor_acara}
                      </h3>
                      <p className="text-sm font-semibold text-primary">
                        {cat.gaya} {cat.jenis_kelamin.charAt(0).toUpperCase() + cat.jenis_kelamin.slice(1)}
                      </p>
                      <p className="text-xs text-muted-foreground">{cat.sesi}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 bg-muted rounded text-muted-foreground">
                      {participants.length} peserta
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-border rounded-lg">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-muted/50 border-b border-border">
                        <tr>
                          <th className="p-3 text-xs font-medium text-muted-foreground uppercase w-12 text-center">No</th>
                          <th className="p-3 text-xs font-medium text-muted-foreground uppercase">Nama Atlet</th>
                          <th className="p-3 text-xs font-medium text-muted-foreground uppercase w-16 text-center">Ket</th>
                          <th className="p-3 text-xs font-medium text-muted-foreground uppercase w-20 text-center">Lahir</th>
                          <th className="p-3 text-xs font-medium text-muted-foreground uppercase">Nama Tim</th>
                          <th className="p-3 text-xs font-medium text-muted-foreground uppercase w-20 text-center">Prestasi</th>
                          <th className="p-3 text-xs font-medium text-muted-foreground uppercase w-20 text-center">Penyisihan</th>
                          <th className="p-3 text-xs font-medium text-muted-foreground uppercase w-20 text-center">Akhir</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {participants.length === 0 ? (
                          <tr>
                            <td className="p-4 text-center text-muted-foreground italic" colSpan={8}>
                              Belum ada peserta terdaftar.
                            </td>
                          </tr>
                        ) : (
                          participants.map((p, idx) => (
                            <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                              <td className="p-3 text-center">{idx + 1}</td>
                              <td className="p-3 font-medium">{p.nama}</td>
                              <td className="p-3 text-center text-muted-foreground">-</td>
                              <td className="p-3 text-center">{p.tahun_lahir ?? '-'}</td>
                              <td className="p-3">{p.team_nama ?? '-'}</td>
                              <td className="p-3 text-center text-muted-foreground">-</td>
                              <td className="p-3 text-center text-muted-foreground">-</td>
                              <td className="p-3 text-center text-muted-foreground">-</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
