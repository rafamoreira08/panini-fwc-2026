import { NextResponse, type NextRequest } from 'next/server'

function isTokenValid(token: string): boolean {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.log('Invalid token format')
      return false
    }
    const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    const now = Math.floor(Date.now() / 1000)
    const isValid = !decoded.exp || decoded.exp > now
    if (!isValid) {
      console.log('Token expired:', { exp: decoded.exp, now })
    }
    return isValid
  } catch (e) {
    console.log('Error validating token:', e)
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
  console.log(`\n>>> MIDDLEWARE: ${pathname}`)
  console.log('Has __session cookie:', !!rawToken)
  if (rawToken) {
    console.log('Cookie value (first 30 chars):', rawToken.substring(0, 30) + '...')
  }

  const hasValidSession = !!rawToken && isTokenValid(rawToken)
  console.log('Token valid:', hasValidSession)

  if (!hasValidSession && !isPublic) {
    console.log('-> REDIRECT TO LOGIN (no valid session)')
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    const res = NextResponse.redirect(url)
    if (rawToken) res.cookies.delete('__session')
    return res
  }

  if (hasValidSession && (pathname === '/login' || pathname === '/register')) {
    console.log('-> REDIRECT TO DASHBOARD (already logged in)')
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  console.log('-> ALLOW REQUEST')
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
