import HeatAssignmentPage from '@/components/admin/heat-assignment'
import { createServerClient } from '@/lib/supabase/server'

export default async function AdminHeatsPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerClient()

  const { data: category } = await supabase
    .from('event_categories')
    .select('*, events(nama)')
    .eq('id', params.id)
    .single()

  if (!category) {
    return <div className="text-center py-12">Kategori tidak ditemukan</div>
  }

  const { data: participants } = await supabase
    .from('participants')
    .select('*')
    .eq('event_category_id', params.id)

  const { data: heats } = await supabase
    .from('heats')
    .select('*, heat_lanes(*, participants(*))')
    .eq('event_category_id', params.id)
    .order('nomor_heat', { ascending: true })

  return (
    <HeatAssignmentPage
      category={category}
      participants={participants ?? []}
      heats={heats ?? []}
    />
  )
}