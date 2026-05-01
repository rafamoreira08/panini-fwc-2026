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

// Stickers are global per user — groupId is not part of the key or document
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
  const snapshot = await getDocs(q)
  const result: Record<string, number> = {}
  for (const d of snapshot.docs) {
    result[d.data().stickerId] = d.data().quantity
  }
  return result
}
