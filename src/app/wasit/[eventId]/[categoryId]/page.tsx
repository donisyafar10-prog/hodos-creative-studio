import WasitTimeInput from '@/components/wasit/time-input'
import { createServerClient } from '@/lib/supabase/server'

export default async function WasitTimeInputPage({
  params,
}: {
  params: { eventId: string; categoryId: string }
}) {
  const supabase = createServerClient()

  const { data: category } = await supabase
    .from('event_categories')
    .select('*, events(nama)')
    .eq('id', params.categoryId)
    .single()

  if (!category) {
    return <div className="text-center py-12">Kategori tidak ditemukan</div>
  }

  const { data: heats } = await supabase
    .from('heats')
    .select('*, heat_lanes(*, participants(*))')
    .eq('event_category_id', params.categoryId)
    .order('nomor_heat', { ascending: true })

  return (
    <WasitTimeInput
      category={category}
      heats={heats ?? []}
    />
  )
}