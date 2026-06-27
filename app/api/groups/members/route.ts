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

function timestampToSeconds(value: any): number {
  if (!value) return 0
  if (typeof value === 'string') {
    const ms = Date.parse(value)
    return Number.isNaN(ms) ? 0 : Math.floor(ms / 1000)
  }
  return 0
}

export async function POST(req: NextRequest) {
  try {
    const { token, groupId, includeStickers } = await req.json()
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
    const runQueryUrl = `https://firestore.googleapis.com/v1/${parent}:runQuery`
    const authHeader = { Authorization: `Bearer ${token}` }
    const jsonHeaders = { ...authHeader, 'Content-Type': 'application/json' }

    // Verify caller is a member of this group
    const memberDocId = `${groupId}-${userId}`
    const memberCheckResp = await fetch(
      `https://firestore.googleapis.com/v1/${parent}/groupMembers/${encodeURIComponent(memberDocId)}`,
      { headers: authHeader }
    )
    if (!memberCheckResp.ok) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 })
    }

    // List all members in this group
    const membersResp = await fetch(runQueryUrl, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'groupMembers' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'groupId' },
              op: 'EQUAL',
              value: { stringValue: groupId },
            },
          },
        },
      }),
    })

    if (!membersResp.ok) {
      const error = await membersResp.text()
      console.error('[API] groups/members list error:', membersResp.status, error)
      return NextResponse.json({ error: 'Failed to list members' }, { status: membersResp.status })
    }

    const membersData = await membersResp.json()
    const memberIds: string[] = []
    const joinedAtMap: Record<string, number> = {}
    for (const item of membersData) {
      if (!item.document) continue
      const f = item.document.fields
      const uid = f.userId?.stringValue
      if (!uid) continue
      memberIds.push(uid)
      joinedAtMap[uid] = timestampToSeconds(f.joinedAt?.timestampValue)
    }

    if (memberIds.length === 0) {
      return NextResponse.json({ members: [] })
    }

    // Fetch user docs + (optionally) sticker collections in parallel
    const userPromises = memberIds.map(uid =>
      fetch(`https://firestore.googleapis.com/v1/${parent}/users/${encodeURIComponent(uid)}`, {
        headers: authHeader,
      })
        .then(r => (r.ok ? r.json() : null))
        .catch(() => null)
    )

    const stickerPromises = includeStickers
      ? memberIds.map(uid =>
          fetch(runQueryUrl, {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({
              structuredQuery: {
                from: [{ collectionId: 'userStickers' }],
                where: {
                  fieldFilter: {
                    field: { fieldPath: 'userId' },
                    op: 'EQUAL',
                    value: { stringValue: uid },
                  },
                },
              },
            }),
          })
            .then(r => (r.ok ? r.json() : []))
            .catch(() => [])
        )
      : memberIds.map(() => Promise.resolve([] as any[]))

    const [userDocs, stickerResults] = await Promise.all([
      Promise.all(userPromises),
      Promise.all(stickerPromises),
    ])

    const members = memberIds.map((uid, i) => {
      const f = userDocs[i]?.fields ?? {}
      const name =
        f.name?.stringValue ||
        f.displayName?.stringValue ||
        f.email?.stringValue ||
        'Usuário'

      const qty: Record<string, number> = {}
      if (includeStickers && Array.isArray(stickerResults[i])) {
        for (const item of stickerResults[i]) {
          if (item.document) {
            const sf = item.document.fields
            const stickerId = sf.stickerId?.stringValue
            const quantity = Number(sf.quantity?.integerValue ?? 0)
            if (stickerId) qty[stickerId] = quantity
          }
        }
      }

      return {
        userId: uid,
        name,
        joinedAt: joinedAtMap[uid],
        qty,
      }
    })

    return NextResponse.json({ members })
  } catch (error: any) {
    console.error('[API] groups/members error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
