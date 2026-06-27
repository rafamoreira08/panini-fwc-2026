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
    const { token, groupId } = await req.json()
    if (!token) {
      return NextResponse.json({ error: 'No token' }, { status: 401 })
    }
    if (typeof groupId !== 'string' || !groupId) {
      return NextResponse.json({ error: 'Invalid groupId' }, { status: 400 })
    }

    const decoded = decodeToken(token)
    const userId = decoded?.user_id || decoded?.sub
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    const parent = `projects/${projectId}/databases/(default)/documents`
    const headers = { Authorization: `Bearer ${token}` }

    const memberDocId = `${groupId}-${userId}`
    const [groupResp, memberResp] = await Promise.all([
      fetch(`https://firestore.googleapis.com/v1/${parent}/groups/${encodeURIComponent(groupId)}`, { headers }),
      fetch(
        `https://firestore.googleapis.com/v1/${parent}/groupMembers/${encodeURIComponent(memberDocId)}`,
        { headers }
      ),
    ])

    if (!groupResp.ok) {
      return NextResponse.json({ notFound: true }, { status: 404 })
    }
    if (!memberResp.ok) {
      return NextResponse.json({ notMember: true }, { status: 403 })
    }

    const groupData = await groupResp.json()
    const f = groupData.fields ?? {}

    return NextResponse.json({
      id: groupId,
      name: f.name?.stringValue ?? '',
      inviteCode: f.inviteCode?.stringValue ?? '',
      createdBy: f.createdBy?.stringValue ?? '',
    })
  } catch (error: any) {
    console.error('[API] groups/get error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
