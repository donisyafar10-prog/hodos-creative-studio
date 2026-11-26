import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { requireRole } from '@/lib/auth'

export default async function WasitLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireRole(['super_admin', 'admin', 'wasit'])
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-helix-bg text-helix-fg border-b border-helix-fg/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="font-anton text-xl tracking-tight uppercase">
              Hodos Creative Studio
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/wasit"
                className={cn(
                  'px-3 py-2 text-sm font-medium transition-colors',
                  pathname === '/wasit' ? 'bg-helix-fg/10' : 'hover:bg-helix-fg/10'
                )}
              >
                Dashboard
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 text-xs font-bold tracking-widest uppercase bg-helix-fg text-helix-bg rounded hover:bg-helix-fg/90 transition-colors"
              >
                Logout
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-16 pb-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}