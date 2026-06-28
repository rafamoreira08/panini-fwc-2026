import { NextRequest, NextResponse } from 'next/server'

function decodeToken(token: string): { user_id?: string; sub?: string } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    return JSON.parse(Buffer.from(parts[1], 'base64').toString())
  } catch {
    return null
  }
}

const VALID_METHODS = ['safe', 'quick', 'quick_manual']

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    if (!token) {
      return NextResponse.json({ error: 'No token' }, { status: 401 })
    }

    const decoded = decodeToken(token)
    const userId = decoded?.user_id || decoded?.sub
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    const docPath = `projects/${projectId}/databases/(default)/documents/users/${userId}`
    const url = `https://firestore.googleapis.com/v1/${docPath}`

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      // No user doc yet — default to safe.
      return NextResponse.json({ editMethod: 'safe' })
    }

    const data = await response.json()
    const value = data.fields?.editMethod?.stringValue
    const editMethod = VALID_METHODS.includes(value) ? value : 'safe'

    return NextResponse.json({ editMethod })
  } catch (error: any) {
    console.error('[API] user-settings error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
