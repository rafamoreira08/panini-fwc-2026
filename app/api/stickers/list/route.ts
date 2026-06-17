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
    const database = `projects/${projectId}/databases/(default)/documents`

    const url = `https://firestore.googleapis.com/v1/${database}/userStickers?pageSize=10000`
    console.log('[API] Querying Firestore:', url)

    // Consulta Firestore via REST API
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    console.log('[API] Firestore response status:', response.status)

    if (!response.ok) {
      const error = await response.text()
      console.error('[API] Firestore error:', response.status, error)
      return NextResponse.json({ error: `Firestore error: ${error}` }, { status: response.status })
    }

    const data = await response.json()
    console.log('[API] Raw data:', JSON.stringify(data).substring(0, 500))
    const documents = data.documents || []
    console.log('[API] Total documents:', documents.length)

    // Filtrar por userId
    const result: Record<string, number> = {}
    for (const doc of documents) {
      const fields = doc.fields
      const docUserId = fields.userId?.stringValue
      const stickerId = fields.stickerId?.stringValue
      const quantity = fields.quantity?.integerValue || 0

      console.log(`[API] Doc: stickerId=${stickerId}, userId=${docUserId}, match=${docUserId === userId}`)

      if (docUserId === userId) {
        result[stickerId] = quantity
      }
    }

    console.log('[API] Filtered result count:', Object.keys(result).length)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[API] Error:', error.message, error.stack)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
