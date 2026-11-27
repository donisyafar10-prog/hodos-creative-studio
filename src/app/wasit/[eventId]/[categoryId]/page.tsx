import { createServerClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import WasitTimeInput from '@/components/wasit/time-input'

export default async function WasitCategoryPage({
  params,
}: {
  params: { eventId: string; categoryId: string }
}) {
  await requireRole(['super_admin', 'admin', 'wasit'])

  const supabase = createServerClient()

  const { data: event } = await supabase
    .from('events')
    .select('id, nama, tanggal, lokasi')
    .eq('id', params.eventId)
    .single()

  const { data: category } = await supabase
    .from('event_categories')
    .select('*')
    .eq('id', params.categoryId)
    .single()

  if (!event || !category) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Data tidak ditemukan</h1>
        </div>
      </div>
    )
  }

  const { data: heats } = await supabase
    .from('heats')
    .select('id, nomor_heat')
    .eq('event_category_id', params.categoryId)
    .order('nomor_heat', { ascending: true })

  const heatIds = heats?.map((h) => h.id) ?? []
  let lanes: any[] = []
  if (heatIds.length > 0) {
    const { data: l } = await supabase
      .from('heat_lanes')
      .select('id, heat_id, nomor_lintasan, participant_id, waktu_prestasi')
      .in('heat_id', heatIds)
    lanes = l ?? []
  }

  const participantIds = lanes
    .filter((lane) => lane.participant_id)
    .map((lane) => lane.participant_id)

  let participantsDetail: any[] = []
  if (participantIds.length > 0) {
    const { data: pds } = await supabase
      .from('participants')
      .select('id, nama, team_id, teams(nama)')
      .in('id', participantIds)
    participantsDetail = pds ?? []
  }

  const pMap = new Map(participantsDetail.map((p) => [p.id, p]))

  // Group lanes by heat
  const heatsWithLanes = (heats ?? []).map((heat) => ({
    ...heat,
    lanes: lanes
      .filter((l) => l.heat_id === heat.id)
      .sort((a, b) => a.nomor_lintasan - b.nomor_lintasan)
      .map((lane) => ({
        ...lane,
        participant: pMap.get(lane.participant_id) ?? null,
      })),
  }))

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-anton text-4xl uppercase">{event.nama}</h1>
            <p className="text-muted-foreground">
              {category.gaya} {category.jenis_kelamin} &nbsp;|&nbsp;
              {category.sesi} &nbsp;|&nbsp;
              Acara {category.nomor_acara}
            </p>
          </div>
          <a
            href={`/api/download/buku-hasil/${event.id}`}
            className="px-4 py-2 bg-helix-bg text-helix-fg rounded hover:bg-helix-bg/90 text-sm font-bold tracking-[0.02em] uppercase"
          >
            Unduh Buku Hasil
          </a>
        </div>

        <WasitTimeInput
          eventId={event.id}
          categoryId={category.id}
          category={category}
          heats={heatsWithLanes}
        />
      </div>
    </div>
  )
}