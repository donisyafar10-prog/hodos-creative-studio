'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface ActiveLinkProps extends React.ComponentPropsWithRef<typeof Link> {
  className?: string
  activeClassName?: string
}

/**
 * A next/navigation Link that adds `activeClassName` when its href matches
 * the current pathname exactly. Used inside Server Component layouts where
 * `usePathname` cannot be called directly.
 */
export function ActiveLink({
  className,
  activeClassName = '',
  children,
  ...props
}: ActiveLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === (props.href as string)
  return (
    <Link
      {...props}
      className={cn(className, isActive ? activeClassName : '')}
    >
      {children}
    </Link>
  )
}
