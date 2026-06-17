import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebase/client'
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'

async function getUid(): Promise<string> {
  const auth = getFirebaseAuth()
  await auth.authStateReady()
  if (!auth.currentUser) throw new Error('Não autenticado')
  return auth.currentUser.uid
}

export async function upsertSticker(stickerId: string, quantity: number) {
  const uid = await getUid()
  const db = getFirebaseFirestore()
  const docId = `${uid}-${stickerId}`

  if (quantity === 0) {
    await deleteDoc(doc(db, 'userStickers', docId))
  } else {
    await setDoc(doc(db, 'userStickers', docId), {
      userId: uid,
      stickerId,
      quantity,
      updatedAt: serverTimestamp(),
    })
  }
}

export async function getUserStickers(userId: string): Promise<Record<string, number>> {
  const db = getFirebaseFirestore()
  const q = query(collection(db, 'userStickers'), where('userId', '==', userId))
  
  try {
    const snapshot = await getDocs(q)
    console.log(`[getUserStickers] Found ${snapshot.docs.length} documents for user ${userId}`)
    const result: Record<string, number> = {}
    for (const d of snapshot.docs) {
      result[d.data().stickerId] = d.data().quantity
    }
    return result
  } catch (error: any) {
    console.error('[getUserStickers] Error:', error.message)
    return {}
  }
}

export async function getMyDuplicatesWithNeeders(groupId: string) {
  const uid = await getUid()
  const db = getFirebaseFirestore()
  const q = query(
    collection(db, 'userStickers'),
    where('userId', '==', uid)
  )
  const snapshot = await getDocs(q)

  const myStickers = new Map<string, number>()
  for (const d of snapshot.docs) {
    const qty = d.data().quantity
    if (qty >= 2) {
      myStickers.set(d.data().stickerId, qty - 1)
    }
  }

  if (myStickers.size === 0) return []

  const groupTeams = (await getGroupMembers(groupId))
    .filter(m => m.userId !== uid)
    .map(m => m.teamCode)

  const teamStickers = await Promise.all(
    groupTeams.map(async teamCode => {
      const q = query(collection(db, 'userStickers'), where('stickerId', '==', teamCode))
      return getDocs(q)
    })
  )

  const needers: Record<string, string[]> = {}
  for (const snapshot of teamStickers) {
    for (const doc of snapshot.docs) {
      const stickerId = doc.data().stickerId
      if (!myStickers.has(stickerId)) continue
      if (!needers[stickerId]) needers[stickerId] = []
      needers[stickerId].push(doc.data().userId)
    }
  }

  return Array.from(myStickers.entries()).map(([stickerId, qty]) => ({
    stickerId,
    quantity: qty,
    needers: needers[stickerId] ?? [],
  }))
}

async function getGroupMembers(groupId: string) {
  const db = getFirebaseFirestore()
  const docSnap = await getDocs(query(collection(db, 'groups')))
  for (const d of docSnap.docs) {
    if (d.id === groupId) {
      return d.data().members || []
    }
  }
  return []
}

export async function signOut() {
  try {
    const { signOut: firebaseSignOut } = await import('firebase/auth')
    await firebaseSignOut(getFirebaseAuth())
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  } catch (error: any) {
    return { error: error.message || 'Erro ao sair' }
  }
}
