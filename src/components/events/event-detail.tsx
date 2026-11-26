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

export default function EventDetail({
  event,
  categories,
}: {
  event: Event
  categories: Category[]
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

      <h2 className="text-2xl font-bold mb-4 uppercase">Buku Acara</h2>

      {categories.length === 0 ? (
        <p className="text-muted-foreground">Belum ada kategori acara yang ditambahkan.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div key={cat.id} className="border border-border rounded-lg p-6">
              <h3 className="font-anton text-xl mb-2 uppercase">
                Acara {cat.nomor_acara}
              </h3>
              <p className="text-sm font-semibold mb-1">{cat.gaya} {cat.jenis_kelamin}</p>
              <p className="text-xs text-muted-foreground">{cat.sesi}</p>
              <Link
                href={`/events/${event.id}/categories/${cat.id}`}
                className="mt-4 inline-block text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80"
              >
                Lihat jadwal & peserta →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
