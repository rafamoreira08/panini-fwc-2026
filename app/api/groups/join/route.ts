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
    const { token, inviteCode } = await req.json()
    if (!token) {
      return NextResponse.json({ error: 'No token' }, { status: 401 })
    }
    if (typeof inviteCode !== 'string' || !inviteCode.trim()) {
      return NextResponse.json({ error: 'Código de convite inválido' }, { status: 400 })
    }

    const decoded = decodeToken(token)
    const userId = decoded?.user_id || decoded?.sub
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    const parent = `projects/${projectId}/databases/(default)/documents`
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }

    // 1) Find group by invite code
    const queryResp = await fetch(`https://firestore.googleapis.com/v1/${parent}:runQuery`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'groups' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'inviteCode' },
              op: 'EQUAL',
              value: { stringValue: inviteCode.trim() },
            },
          },
          limit: 1,
        },
      }),
    })

    if (!queryResp.ok) {
      const error = await queryResp.text()
      console.error('[API] groups/join lookup error:', queryResp.status, error)
      return NextResponse.json({ error: 'Falha ao buscar grupo' }, { status: queryResp.status })
    }

    const queryData = await queryResp.json()
    let groupId: string | null = null
    for (const item of queryData) {
      if (item.document?.name) {
        groupId = (item.document.name as string).split('/').pop() ?? null
        break
      }
    }
    if (!groupId) {
      return NextResponse.json({ error: 'Código de convite inválido' }, { status: 404 })
    }

    // 2) Check if user is already a member
    const memberDocId = `${groupId}-${userId}`
    const memberCheckResp = await fetch(
      `https://firestore.googleapis.com/v1/${parent}/groupMembers/${encodeURIComponent(memberDocId)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (memberCheckResp.ok) {
      return NextResponse.json(
        { error: 'Você já é membro deste grupo', groupId },
        { status: 409 }
      )
    }

    // 3) Create membership
    const now = new Date().toISOString()
    const createResp = await fetch(
      `https://firestore.googleapis.com/v1/${parent}/groupMembers/${encodeURIComponent(memberDocId)}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          fields: {
            groupId: { stringValue: groupId },
            userId: { stringValue: userId },
            joinedAt: { timestampValue: now },
          },
        }),
      }
    )

    if (!createResp.ok) {
      const error = await createResp.text()
      console.error('[API] groups/join create error:', createResp.status, error)
      return NextResponse.json({ error: 'Falha ao entrar no grupo' }, { status: createResp.status })
    }

    return NextResponse.json({ groupId })
  } catch (error: any) {
    console.error('[API] groups/join error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
