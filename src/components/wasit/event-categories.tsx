import Link from 'next/link'

interface Event {
  nama: string
}

interface Category {
  id: string
  event_id: string
  nomor_acara: string
  gaya: string
  jenis_kelamin: string
  sesi: string
}

export default function WasitEventCategories({
  event,
  categories,
}: {
  event: Event
  categories: Category[]
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-anton text-3xl mb-2 uppercase">{event.nama}</h1>
        <a href="/wasit" className="text-sm underline underline-offset-4">
          ← Kembali
        </a>
      </div>

      <h2 className="text-xl font-semibold uppercase mb-4">Pilih Kategori</h2>

      <div className="grid gap-3">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/wasit/${cat.event_id}/${cat.id}`}
            className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors text-left"
          >
            <div className="font-medium uppercase">Acara {cat.nomor_acara}</div>
            <div className="text-sm text-muted-foreground">
              {cat.gaya} {cat.jenis_kelamin} - {cat.sesi}
            </div>
          </Link>
        ))}
        {categories.length === 0 && (
          <div className="border border-border rounded-lg p-8 text-center text-muted-foreground">
            Belum ada kategori yang tersedia.
          </div>
        )}
      </div>
    </div>
  )
}