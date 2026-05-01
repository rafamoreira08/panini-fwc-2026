import { NextResponse, type NextRequest } from 'next/server'

function isTokenValid(token: string): boolean {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return false
    const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    const now = Math.floor(Date.now() / 1000)
    return !decoded.exp || decoded.exp > now
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/join/') ||
    pathname.startsWith('/api/')

  const rawToken = request.cookies.get('__session')?.value
  const hasValidSession = !!rawToken && isTokenValid(rawToken)

  // Expired/missing session trying to access protected routes — clear cookie + redirect to login
  if (!hasValidSession && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    const res = NextResponse.redirect(url)
    if (rawToken) res.cookies.delete('__session') // clear expired cookie
    return res
  }

  // Logged in and trying to access auth pages
  if (hasValidSession && (pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
