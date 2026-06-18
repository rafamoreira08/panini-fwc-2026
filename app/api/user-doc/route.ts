import { NextRequest, NextResponse } from 'next/server'

function decodeToken(token: string): { user_id?: string; sub?: string; email?: string } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    return JSON.parse(Buffer.from(parts[1], 'base64').toString())
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const { token, name, email } = await req.json()

    if (!token) {
      return NextResponse.json({ error: 'No token' }, { status: 401 })
    }

    const decoded = decodeToken(token)
    const userId = decoded?.user_id || decoded?.sub
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const trimmedName = typeof name === 'string' ? name.trim() : ''
    const trimmedEmail = typeof email === 'string' ? email.trim() : decoded?.email?.trim() || ''

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    const docPath = `projects/${projectId}/databases/(default)/documents/users/${userId}`
    const url = `https://firestore.googleapis.com/v1/${docPath}?updateMask.fieldPaths=name&updateMask.fieldPaths=email&updateMask.fieldPaths=displayName&updateMask.fieldPaths=updatedAt`

    const body = {
      fields: {
        name: { stringValue: trimmedName },
        email: { stringValue: trimmedEmail },
        displayName: { stringValue: trimmedName },
        updatedAt: { timestampValue: new Date().toISOString() },
      },
    }

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[API] Firestore user-doc error:', response.status, error)
      return NextResponse.json({ error: 'Firestore error' }, { status: response.status })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[API] user-doc error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
