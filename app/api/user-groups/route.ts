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
    const { token } = await req.json()
    if (!token) {
      return NextResponse.json({ error: 'No token' }, { status: 401 })
    }

    const decoded = decodeToken(token)
    const userId = decoded?.user_id || decoded?.sub
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    const parent = `projects/${projectId}/databases/(default)/documents`
    const runQueryUrl = `https://firestore.googleapis.com/v1/${parent}:runQuery`
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }

    // 1) Find groupMembers where userId == uid
    const membershipResp = await fetch(runQueryUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'groupMembers' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'userId' },
              op: 'EQUAL',
              value: { stringValue: userId },
            },
          },
        },
      }),
    })

    if (!membershipResp.ok) {
      const error = await membershipResp.text()
      console.error('[API] memberships query error:', membershipResp.status, error)
      return NextResponse.json({ error: 'Firestore error' }, { status: membershipResp.status })
    }

    const membershipItems = await membershipResp.json()
    const memberships: { groupId: string; joinedAt: number }[] = []
    for (const item of membershipItems) {
      if (!item.document) continue
      const f = item.document.fields
      const groupId = f.groupId?.stringValue
      if (!groupId) continue
      memberships.push({
        groupId,
        joinedAt: timestampToSeconds(f.joinedAt?.timestampValue),
      })
    }

    if (memberships.length === 0) {
      return NextResponse.json([])
    }

    // 2) Fetch each group doc + count members in parallel
    const groups = await Promise.all(
      memberships.map(async ({ groupId, joinedAt }) => {
        const [groupResp, countResp] = await Promise.all([
          fetch(`https://firestore.googleapis.com/v1/${parent}/groups/${groupId}`, { headers }),
          fetch(runQueryUrl, {
            method: 'POST',
            headers,
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
                select: { fields: [{ fieldPath: 'userId' }] },
              },
            }),
          }),
        ])

        if (!groupResp.ok) return null
        const groupDoc = await groupResp.json()
        const f = groupDoc.fields ?? {}

        let memberCount = 0
        if (countResp.ok) {
          const countItems = await countResp.json()
          for (const item of countItems) {
            if (item.document) memberCount++
          }
        }

        return {
          id: groupId,
          name: f.name?.stringValue ?? '',
          inviteCode: f.inviteCode?.stringValue ?? '',
          createdBy: f.createdBy?.stringValue ?? '',
          memberCount,
          joinedAt,
        }
      })
    )

    const result = groups
      .filter((g): g is NonNullable<typeof g> => g !== null)
      .sort((a, b) => b.joinedAt - a.joinedAt)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[API] user-groups error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
