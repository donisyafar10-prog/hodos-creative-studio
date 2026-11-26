export default function BestSwimmer() {
  return (
    <section className="mb-12">
      <h2 className="font-anton text-2xl mb-4 uppercase">Best Swimmer</h2>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="border border-border rounded-lg p-6">
          <h3 className="font-anton text-xl mb-3 uppercase text-blue-600">Putra</h3>
          <p className="text-sm text-muted-foreground text-center">
            Belum ada data best swimmer putra.
          </p>
        </div>
        <div className="border border-border rounded-lg p-6">
          <h3 className="font-anton text-xl mb-3 uppercase text-rose-600">Putri</h3>
          <p className="text-sm text-muted-foreground text-center">
            Belum ada data best swimmer putri.
          </p>
        </div>
      </div>
    </section>
  )
}
