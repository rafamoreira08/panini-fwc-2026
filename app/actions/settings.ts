import { getFirebaseAuth } from '@/lib/firebase/client'
import { EditMethod } from '@/lib/types'

async function getToken(): Promise<string> {
  const auth = getFirebaseAuth()
  await auth.authStateReady()
  if (!auth.currentUser) throw new Error('Não autenticado')
  return auth.currentUser.getIdToken()
}

export async function getEditMethod(): Promise<EditMethod> {
  const token = await getToken()
  const res = await fetch('/api/user-settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
  if (!res.ok) return 'safe'
  const data = await res.json()
  return (data.editMethod as EditMethod) ?? 'safe'
}

export async function updateEditMethod(editMethod: EditMethod): Promise<void> {
  const token = await getToken()
  const res = await fetch('/api/update-user-settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, editMethod }),
  })
  if (!res.ok) {
    throw new Error(`Falha ao salvar preferência (${res.status})`)
  }
}
