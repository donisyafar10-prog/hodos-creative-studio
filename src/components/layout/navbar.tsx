'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export type NavbarLinkProps = {
  href: string
  label: string
  isActive?: boolean
}

function NavbarLink({ href, label, isActive }: NavbarLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'font-[var(--font-inter-tight)] text-[13px] font-bold tracking-[0.02em] uppercase px-3 py-2',
        isActive ? 'bg-helix-fg/10 text-helix-fg' : 'text-helix-fg/80 hover:bg-helix-fg/10'
      )}
    >
      {label}
    </Link>
  )
}

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  async function loadAuth() {
    const res = await fetch('/api/auth/status')
    const json = await res.json()
    setIsLoggedIn(!!json.isLoggedIn)
  }

  useEffect(() => {
    loadAuth()
  }, [])

  const isActive = (route: string) => pathname === route || pathname.startsWith(`${route}/`)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

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
            <div className="flex items-center gap-2">
              <NavbarLink href="/events" label="Events" isActive={isActive('/events')} />
              <NavbarLink href="/registrasi" label="Registrasi" isActive={isActive('/registrasi')} />
              <NavbarLink href="/ranking" label="Ranking" isActive={isActive('/ranking')} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="font-[var(--font-inter-tight)] text-[13px] font-bold tracking-[0.02em] uppercase px-4 py-2 bg-helix-fg text-helix-bg rounded hover:bg-helix-fg/90 transition-colors"
            >
              {isLoggedIn ? 'Logout' : 'Login'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
