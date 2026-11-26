import CategoryList from '@/components/admin/category-list'
import { createServerClient } from '@/lib/supabase/server'

export default async function AdminCategoriesPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerClient()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!event) {
    return <div className="text-center py-12">Event tidak ditemukan</div>
  }

  const { data: categories } = await supabase
    .from('event_categories')
    .select('*')
    .eq('event_id', params.id)
    .order('urutan', { ascending: true })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-anton text-4xl uppercase">{event.nama}</h1>
          <p className="text-muted-foreground">Kelola Kategori Acara</p>
        </div>
        <a href={`/admin/events/${params.id}/categories/new`}>
          <button className="px-4 py-2 bg-helix-bg text-helix-fg rounded hover:bg-helix-bg/90 text-sm font-medium">
            + Kategori Baru
          </button>
        </a>
      </div>

      <CategoryList eventId={params.id} categories={categories ?? []} />
    </div>
  )
}