import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const DOWNLOAD_ROLE_PREFIX = '/download'
const ADMIN_ROUTE_PREFIX = '/admin'
const REGISTRASI_ROUTE = '/registrasi'
const WASIT_ROUTE_PREFIX = '/wasit'
const LOGIN_ROUTE = '/login'

const DOWNLOADABLE_ROLES = ['super_admin', 'admin', 'official']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public routes that don't need auth
  const isPublic = pathname === '/' || pathname === LOGIN_ROUTE || pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.startsWith('/download/')

  // Download routes - role gated
  if (pathname.startsWith(DOWNLOAD_ROLE_PREFIX)) {
    if (!user) {
      return NextResponse.redirect(new URL(`${LOGIN_ROUTE}?callback=${pathname}`, request.url))
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const role = profile?.role
    if (!role || !DOWNLOADABLE_ROLES.includes(role)) {
      return new NextResponse('Forbidden - download access restricted', { status: 403 })
    }
    return response
  }

  // Admin routes - super_admin or admin
  if (pathname.startsWith(ADMIN_ROUTE_PREFIX)) {
    if (!user) {
      return NextResponse.redirect(new URL(`${LOGIN_ROUTE}?callback=${pathname}`, request.url))
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const role = profile?.role
    if (!role || !['super_admin', 'admin'].includes(role)) {
      return NextResponse.redirect(new URL(LOGIN_ROUTE, request.url))
    }
    return response
  }

  // Registrasi - official, admin, super_admin
  if (pathname === REGISTRASI_ROUTE || pathname.startsWith('/registrasi/')) {
    if (!user) {
      return NextResponse.redirect(new URL(`${LOGIN_ROUTE}?callback=${pathname}`, request.url))
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const role = profile?.role
    if (!role || !['super_admin', 'admin', 'official'].includes(role)) {
      return NextResponse.redirect(new URL(LOGIN_ROUTE, request.url))
    }
    return response
  }

  // Wasit routes - wasit, admin, super_admin
  if (pathname.startsWith(WASIT_ROUTE_PREFIX)) {
    if (!user) {
      return NextResponse.redirect(new URL(`${LOGIN_ROUTE}?callback=${pathname}`, request.url))
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const role = profile?.role
    if (!role || !['super_admin', 'admin', 'wasit'].includes(role)) {
      return NextResponse.redirect(new URL(LOGIN_ROUTE, request.url))
    }
    return response
  }

  // If authenticated and on login page, redirect to dashboard based on role
  if (pathname === LOGIN_ROUTE && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const role = profile?.role
    if (role === 'super_admin') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin/events', request.url))
    }
    if (role === 'official') {
      return NextResponse.redirect(new URL('/registrasi', request.url))
    }
    if (role === 'wasit') {
      return NextResponse.redirect(new URL('/wasit', request.url))
    }
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL(`${LOGIN_ROUTE}?callback=${pathname}`, request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/registrasi/:path*',
    '/wasit/:path*',
    '/download/:path*',
    '/login',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}