import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protected routes
  if (['/', '/dashboard'].some(prefix => 
    req.nextUrl.pathname === prefix || 
    req.nextUrl.pathname.startsWith(prefix + '/')
  )) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Admin-only routes
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single()

      if (error || !profile?.is_admin) {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }
  }

  // Auth routes (login/signup) - redirect if already logged in
  if (['/login', '/signup'].includes(req.nextUrl.pathname)) {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/login',
    '/signup',
  ]
}