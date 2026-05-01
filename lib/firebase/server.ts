import { cookies } from 'next/headers'

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('__session')?.value

    if (!token) return null

    // Decode JWT without verification (development fallback)
    // WARNING: Not secure for production — use firebase-admin in production.
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    const now = Math.floor(Date.now() / 1000)

    if (decoded.exp && decoded.exp < now) return null

    return { uid: decoded.user_id || decoded.sub, email: decoded.email }
  } catch (error) {
    return null
  }
}

