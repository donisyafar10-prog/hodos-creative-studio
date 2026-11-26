'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    router.push('/login')
  }

  const isActive = (route: string) => pathname === route || pathname.startsWith(`${route}/`)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-helix-bg text-helix-fg border-b border-helix-fg/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-[var(--font-inter-tight)] text-[22px] font-bold tracking-[-0.01em] uppercase">
              Hodos Creative Studio
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-2 font-[var(--font-inter-tight)] text-[13px] font-bold tracking-[0.02em] uppercase">
              <Link
                href="/events"
                className={cn('px-3 py-2', isActive('/events') ? 'bg-helix-fg/10' : '')}
              >
                Events
              </Link>
              <Link
                href="/registrasi"
                className={cn('px-3 py-2', isActive('/registrasi') ? 'bg-helix-fg/10' : '')}
              >
                Registrasi
              </Link>
              <Link
                href="/ranking"
                className={cn('px-3 py-2', isActive('/ranking') ? 'bg-helix-fg/10' : '')}
              >
                Ranking
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="font-[var(--font-inter-tight)] text-[13px] font-bold tracking-[0.02em] uppercase px-4 py-2 bg-helix-fg text-helix-bg rounded hover:bg-helix-fg/90 transition-colors"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}