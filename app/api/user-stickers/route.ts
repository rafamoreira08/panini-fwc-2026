import { NextRequest, NextResponse } from 'next/server'

function decodeToken(token: string): { user_id?: string; sub?: string } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    return decoded
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    console.log('[API] POST /api/user-stickers')

    if (!token) {
      return NextResponse.json({ error: 'No token' }, { status: 401 })
    }

    const decoded = decodeToken(token)
    const userId = decoded?.user_id || decoded?.sub
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    console.log('[API] userId:', userId)

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    const database = `projects/${projectId}/databases/(default)`
    const url = `https://firestore.googleapis.com/v1/${database}:runQuery`

    const queryBody = {
      structuredQuery: {
        from: [{ collectionId: 'userStickers' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'userId' },
            op: 'EQUAL',
            value: { stringValue: userId },
          },
        },
      },
    }

    console.log('[API] Querying Firestore for userId:', userId)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(queryBody),
    })

    console.log('[API] Firestore status:', response.status)

    if (!response.ok) {
      const error = await response.text()
      console.error('[API] Firestore error:', error)
      return NextResponse.json({ error: 'Firestore error' }, { status: response.status })
    }

    const text = await response.text()
    const lines = text.trim().split('\n')
    const result: Record<string, number> = {}

    for (const line of lines) {
      if (!line) continue
      const data = JSON.parse(line)

      if (data.document) {
        const fields = data.document.fields
        const stickerId = fields.stickerId?.stringValue
        const quantity = fields.quantity?.integerValue || 0
        result[stickerId] = quantity
      }
    }

    console.log('[API] Returning', Object.keys(result).length, 'stickers')
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[API] Error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
