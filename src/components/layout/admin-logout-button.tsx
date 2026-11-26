'use client'

import { useRouter } from 'next/navigation'

export default function AdminLogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="font-[var(--font-inter-tight)] text-[13px] font-bold tracking-[0.02em] uppercase px-4 py-2 bg-helix-fg text-helix-bg rounded hover:bg-helix-fg/90 transition-colors"
    >
      Logout
    </button>
  )
}