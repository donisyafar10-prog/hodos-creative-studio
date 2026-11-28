import Link from 'next/link'
import { cn } from '@/lib/utils'
import { requireRole } from '@/lib/auth'
import WasitLogoutButton from '@/components/wasit/logout-button'
import { ActiveLink } from '@/components/layout/active-link'

export default async function WasitLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireRole(['super_admin', 'admin', 'wasit'])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-helix-bg text-helix-fg border-b border-helix-fg/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="font-anton text-xl tracking-tight uppercase">
              Hodos Creative Studio
            </Link>
            <div className="flex items-center gap-4">
              <ActiveLink
                href="/wasit"
                className={cn(
                  'px-3 py-2 text-sm font-medium transition-colors',
                  'text-helix-fg/70 hover:bg-helix-fg/10'
                )}
                activeClassName="bg-helix-fg/10 text-helix-fg"
              >
                Dashboard
              </ActiveLink>
              <WasitLogoutButton />
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