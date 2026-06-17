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

export async function POST(req: NextRequest) {
  try {
    const { token, stickerId, quantity } = await req.json()

    if (!token) {
      return NextResponse.json({ error: 'No token' }, { status: 401 })
    }
    if (typeof stickerId !== 'string' || typeof quantity !== 'number') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const decoded = decodeToken(token)
    const userId = decoded?.user_id || decoded?.sub
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    const docId = `${userId}-${stickerId}`
    const docPath = `projects/${projectId}/databases/(default)/documents/userStickers/${docId}`
    const url = `https://firestore.googleapis.com/v1/${docPath}`

    if (quantity === 0) {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok && response.status !== 404) {
        const error = await response.text()
        console.error('[API] Firestore delete error:', response.status, error)
        return NextResponse.json({ error: 'Firestore error' }, { status: response.status })
      }
      return NextResponse.json({ ok: true })
    }

    const body = {
      fields: {
        userId: { stringValue: userId },
        stickerId: { stringValue: stickerId },
        quantity: { integerValue: String(quantity) },
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
      console.error('[API] Firestore write error:', response.status, error)
      return NextResponse.json({ error: 'Firestore error' }, { status: response.status })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[API] Error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
