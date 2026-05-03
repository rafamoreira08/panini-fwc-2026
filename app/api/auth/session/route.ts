import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()
    console.log('\n=== API /auth/session ===')
    console.log('Token received:', token?.substring(0, 20) + '...')

    if (!token) {
      console.log('ERROR: No token provided')
      return NextResponse.json({ error: 'No token' }, { status: 400 })
    }

    const parts = token.split('.')
    if (parts.length !== 3) {
      console.log('ERROR: Invalid token format, parts:', parts.length)
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    try {
      const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString())
      const now = Math.floor(Date.now() / 1000)
      const expiresIn = decoded.exp ? decoded.exp - now : 'unknown'
      console.log('Token valid, expires in:', expiresIn, 'seconds')
    } catch (e) {
      console.log('ERROR: Could not decode token:', e)
    }

    const cookieStore = await cookies()
    cookieStore.set('__session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    console.log('Cookie set successfully')
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.log('ERROR in session API:', error)
    return NextResponse.json({ error: 'Failed to set session' }, { status: 500 })
  }
}
