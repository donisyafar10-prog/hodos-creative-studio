import MedalTable from '@/components/ranking/medal-table'
import BestSwimmer from '@/components/ranking/best-swimmer'

export default function RankingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-anton text-4xl mb-8 text-center uppercase">Rekap Medali</h1>

        <div className="flex flex-col gap-8">
          <MedalTable />
          <BestSwimmer />
        </div>
      </div>
    </div>
  )
}
