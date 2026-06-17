'use client'

import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebase/client'
import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
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
  console.log('[getUserStickers] Starting - userId:', userId)

  try {
    console.log('[getUserStickers] Fetching all userStickers...')
    const snapshot = await getDocs(collection(db, 'userStickers'))
    console.log(`[getUserStickers] Found ${snapshot.docs.length} total documents`)

    const result: Record<string, number> = {}
    for (const d of snapshot.docs) {
      const data = d.data()
      if (data.userId === userId) {
        result[data.stickerId] = data.quantity
        console.log(`[getUserStickers] Added ${data.stickerId}: ${data.quantity}`)
      }
    }
    console.log('[getUserStickers] Result:', Object.keys(result).length, 'stickers')
    return result
  } catch (error: any) {
    console.error('[getUserStickers] ERROR:', error.code, error.message)
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

  const userNames = new Map<string, string>()
  for (const userIds of Object.values(needers)) {
    for (const userId of userIds) {
      if (!userNames.has(userId)) {
        const userDoc = await getDoc(doc(db, 'users', userId))
        const userName = userDoc.data()?.name ?? userId
        userNames.set(userId, userName)
      }
    }
  }

  return Array.from(myStickers.entries()).map(([stickerId, qty]) => ({
    sticker_id: stickerId,
    quantity: qty,
    needers: (needers[stickerId] ?? []).map(userId => ({
      user_id: userId,
      name: userNames.get(userId) || userId,
    })),
  }))
}

async function getGroupMembers(groupId: string): Promise<Array<{ userId: string; teamCode: string }>> {
  const db = getFirebaseFirestore()
  const docSnap = await getDocs(query(collection(db, 'groups')))
  for (const d of docSnap.docs) {
    if (d.id === groupId) {
      return (d.data().members || []) as Array<{ userId: string; teamCode: string }>
    }
  }
  return []
}

export async function findTradersForSticker(groupId: string, stickerId: string) {
  const uid = await getUid()
  const db = getFirebaseFirestore()

  const q = query(
    collection(db, 'userStickers'),
    where('stickerId', '==', stickerId),
    where('quantity', '>=', 2)
  )
  const snapshot = await getDocs(q)

  const myStickersSnap = await getDocs(
    query(collection(db, 'userStickers'), where('userId', '==', uid))
  )
  const myStickers = new Set<string>()
  for (const d of myStickersSnap.docs) {
    if (d.data().quantity >= 2) {
      myStickers.add(d.data().stickerId)
    }
  }

  const traders = []
  for (const docSnap of snapshot.docs) {
    const traderId = docSnap.data().userId
    if (traderId === uid) continue

    const traderStickersSnap = await getDocs(
      query(collection(db, 'userStickers'), where('userId', '==', traderId))
    )
    const traderStickers = new Set<string>()
    for (const d of traderStickersSnap.docs) {
      traderStickers.add(d.data().stickerId)
    }

    const canOffer = Array.from(myStickers).filter(s => !traderStickers.has(s))

    const userDocRef = await getDoc(doc(db, 'users', traderId))
    const userName = userDocRef.data()?.name ?? traderId

    traders.push({
      user_id: traderId,
      name: userName,
      quantity: docSnap.data().quantity,
      canOffer,
    })
  }

  return traders
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
