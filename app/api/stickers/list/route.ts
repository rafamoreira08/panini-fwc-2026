import { NextRequest, NextResponse } from 'next/server'
import { jwtDecode } from 'jwt-decode'

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    console.log('[API] POST /stickers/list - token received')
    if (!token) {
      console.log('[API] No token provided')
      return NextResponse.json({ error: 'No token' }, { status: 401 })
    }

    const decoded = jwtDecode<{ uid: string }>(token)
    const userId = decoded.uid
    console.log('[API] Decoded userId:', userId)

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    console.log('[API] ProjectId:', projectId)
    const database = `projects/${projectId}/databases/(default)`

    const url = `https://firestore.googleapis.com/v1/${database}:runQuery`
    console.log('[API] Querying Firestore via runQuery:', url)

    // Query usando Firestore REST API com filtro userId
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

    console.log('[API] Query body:', JSON.stringify(queryBody))

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(queryBody),
    })

    console.log('[API] Firestore response status:', response.status)

    if (!response.ok) {
      const error = await response.text()
      console.error('[API] Firestore error:', response.status, error)
      return NextResponse.json({ error: `Firestore error: ${error}` }, { status: response.status })
    }

    const text = await response.text()
    console.log('[API] Raw response:', text.substring(0, 1000))

    // Firestore runQuery returns newline-delimited JSON
    const lines = text.trim().split('\n')
    const result: Record<string, number> = {}

    for (const line of lines) {
      if (!line) continue
      const data = JSON.parse(line)
      console.log('[API] Response item:', JSON.stringify(data).substring(0, 300))

      if (data.document) {
        const doc = data.document
        const fields = doc.fields
        const stickerId = fields.stickerId?.stringValue
        const quantity = fields.quantity?.integerValue || 0
        console.log(`[API] Found doc: stickerId=${stickerId}, quantity=${quantity}`)
        result[stickerId] = quantity
      }
    }

    console.log('[API] Final result count:', Object.keys(result).length)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[API] Error:', error.message, error.stack)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
