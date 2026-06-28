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
    const { token, editMethod } = await req.json()

    if (!token) {
      return NextResponse.json({ error: 'No token' }, { status: 401 })
    }
    if (!VALID_METHODS.includes(editMethod)) {
      return NextResponse.json({ error: 'Invalid editMethod' }, { status: 400 })
    }

    const decoded = decodeToken(token)
    const userId = decoded?.user_id || decoded?.sub
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    const docPath = `projects/${projectId}/databases/(default)/documents/users/${userId}`
    const url = `https://firestore.googleapis.com/v1/${docPath}?updateMask.fieldPaths=editMethod&updateMask.fieldPaths=updatedAt`

    const body = {
      fields: {
        editMethod: { stringValue: editMethod },
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
      console.error('[API] update-user-settings error:', response.status, error)
      return NextResponse.json({ error: 'Firestore error' }, { status: response.status })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[API] update-user-settings error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
