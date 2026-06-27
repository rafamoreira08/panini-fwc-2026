import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

function decodeToken(token: string): { user_id?: string; sub?: string } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    return JSON.parse(Buffer.from(parts[1], 'base64').toString())
  } catch {
    return null
  }
}

function generateInviteCode(): string {
  return randomBytes(6).toString('hex').toUpperCase()
}

export async function POST(req: NextRequest) {
  try {
    const { token, name } = await req.json()
    if (!token) {
      return NextResponse.json({ error: 'No token' }, { status: 401 })
    }
    if (typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })
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
    const now = new Date().toISOString()
    const inviteCode = generateInviteCode()

    // 1) Create group document (auto-generated ID)
    const groupResp = await fetch(`https://firestore.googleapis.com/v1/${parent}/groups`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        fields: {
          name: { stringValue: name.trim() },
          inviteCode: { stringValue: inviteCode },
          createdBy: { stringValue: userId },
          createdAt: { timestampValue: now },
        },
      }),
    })

    if (!groupResp.ok) {
      const error = await groupResp.text()
      console.error('[API] groups/create group error:', groupResp.status, error)
      return NextResponse.json({ error: 'Falha ao criar grupo' }, { status: groupResp.status })
    }

    const groupData = await groupResp.json()
    const groupId = (groupData.name as string).split('/').pop() as string

    // 2) Add creator as the first member
    const memberDocId = `${groupId}-${userId}`
    const memberResp = await fetch(
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

    if (!memberResp.ok) {
      const error = await memberResp.text()
      console.error('[API] groups/create member error:', memberResp.status, error)
      return NextResponse.json(
        { error: 'Grupo criado, mas falhou ao adicionar membro', groupId },
        { status: memberResp.status }
      )
    }

    return NextResponse.json({ groupId })
  } catch (error: any) {
    console.error('[API] groups/create error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
