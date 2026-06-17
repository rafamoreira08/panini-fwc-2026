import { NextRequest, NextResponse } from 'next/server'
import { jwtDecode } from 'jwt-decode'

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    if (!token) {
      return NextResponse.json({ error: 'No token' }, { status: 401 })
    }

    const decoded = jwtDecode<{ uid: string }>(token)
    const userId = decoded.uid

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    const database = `projects/${projectId}/databases/(default)/documents`

    // Consulta Firestore via REST API
    const response = await fetch(
      `https://firestore.googleapis.com/v1/${database}/userStickers?pageSize=10000`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('[API] Firestore error:', response.status, error)
      return NextResponse.json({ error: 'Firestore error' }, { status: response.status })
    }

    const data = await response.json()
    const documents = data.documents || []

    // Filtrar por userId
    const result: Record<string, number> = {}
    for (const doc of documents) {
      const fields = doc.fields
      if (fields.userId?.stringValue === userId) {
        result[fields.stickerId?.stringValue] = fields.quantity?.integerValue || 0
      }
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
