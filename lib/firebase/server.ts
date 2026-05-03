import { cookies } from 'next/headers'

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('__session')?.value

    console.log('[getCurrentUser] Token:', token ? 'present' : 'missing')

    if (!token) {
      console.log('[getCurrentUser] No token found')
      return null
    }

    // Decode JWT without verification (development fallback)
    // WARNING: Not secure for production — use firebase-admin in production.
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.log('[getCurrentUser] Invalid token format')
      return null
    }

    const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    const now = Math.floor(Date.now() / 1000)

    console.log('[getCurrentUser] Token exp:', decoded.exp, 'now:', now, 'valid:', !decoded.exp || decoded.exp > now)

    if (decoded.exp && decoded.exp < now) {
      console.log('[getCurrentUser] Token expired')
      return null
    }

    const user = { uid: decoded.user_id || decoded.sub, email: decoded.email }
    console.log('[getCurrentUser] User:', user)
    return user
  } catch (error) {
    console.log('[getCurrentUser] Error:', error)
    return null
  }
}

