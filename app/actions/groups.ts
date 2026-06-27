import { getFirebaseAuth } from '@/lib/firebase/client'

async function getToken(): Promise<string> {
  const auth = getFirebaseAuth()
  await auth.authStateReady()
  if (!auth.currentUser) throw new Error('Não autenticado')
  return auth.currentUser.getIdToken()
}

async function parseError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json()
    return data?.error || fallback
  } catch {
    return fallback
  }
}

export async function createGroup(name: string): Promise<string> {
  const token = await getToken()
  const res = await fetch('/api/groups/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, name }),
  })
  if (!res.ok) {
    throw new Error(await parseError(res, `Falha ao criar grupo (${res.status})`))
  }
  const data = await res.json()
  return data.groupId
}

export async function joinGroup(inviteCode: string): Promise<string> {
  const token = await getToken()
  const res = await fetch('/api/groups/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, inviteCode }),
  })
  if (!res.ok) {
    throw new Error(await parseError(res, `Falha ao entrar no grupo (${res.status})`))
  }
  const data = await res.json()
  return data.groupId
}

export async function joinGroupByCode(inviteCode: string): Promise<string> {
  return joinGroup(inviteCode)
}
