'use server'

import { getCurrentUser } from '@/lib/firebase/server'
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { firestore } from '@/lib/firebase/client'

export async function upsertSticker(groupId: string, stickerId: string, quantity: number) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Não autenticado')

  try {
    // Verify user is in group
    const memberDoc = await getDoc(doc(firestore, 'groupMembers', `${groupId}-${user.uid}`))
    if (!memberDoc.exists()) throw new Error('Sem permissão')

    const docId = `${user.uid}-${groupId}-${stickerId}`

    if (quantity === 0) {
      await deleteDoc(doc(firestore, 'userStickers', docId))
    } else {
      await setDoc(doc(firestore, 'userStickers', docId), {
        userId: user.uid,
        groupId,
        stickerId,
        quantity,
        updatedAt: serverTimestamp(),
      })
    }
  } catch (error: any) {
    throw new Error(error.message || 'Falha ao atualizar figurinha')
  }
}

export async function getUserStickersForGroup(groupId: string, userId: string) {
  try {
    const q = query(
      collection(firestore, 'userStickers'),
      where('userId', '==', userId),
      where('groupId', '==', groupId)
    )
    const snapshot = await getDocs(q)

    return snapshot.docs.map(doc => ({
      stickerId: doc.data().stickerId,
      quantity: doc.data().quantity,
    }))
  } catch (error: any) {
    throw new Error(error.message || 'Falha ao buscar figurinhas')
  }
}

export async function findTradersForSticker(groupId: string, stickerId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Não autenticado')

  try {
    // Find who has this sticker as duplicate (qty >= 2) in this group
    const q = query(
      collection(firestore, 'userStickers'),
      where('groupId', '==', groupId),
      where('stickerId', '==', stickerId)
    )
    const snapshot = await getDocs(q)

    const traders = snapshot.docs
      .filter(doc => doc.data().quantity >= 2 && doc.data().userId !== user.uid)
      .map(doc => ({
        userId: doc.data().userId,
        quantity: doc.data().quantity,
      }))

    if (traders.length === 0) return []

    // Get my duplicates
    const myDupesQ = query(
      collection(firestore, 'userStickers'),
      where('userId', '==', user.uid),
      where('groupId', '==', groupId)
    )
    const myDupesSnapshot = await getDocs(myDupesQ)
    const myDupeIds = new Set(
      myDupesSnapshot.docs.filter(doc => doc.data().quantity >= 2).map(doc => doc.data().stickerId)
    )

    // For each trader, find which of my dupes they don't have
    const result = await Promise.all(
      traders.map(async trader => {
        const theirStickersQ = query(
          collection(firestore, 'userStickers'),
          where('userId', '==', trader.userId),
          where('groupId', '==', groupId)
        )
        const theirSnapshot = await getDocs(theirStickersQ)
        const theyHave = new Set(theirSnapshot.docs.map(doc => doc.data().stickerId))

        const canOffer = [...myDupeIds].filter(id => !theyHave.has(id))

        const userDoc = await getDoc(doc(firestore, 'users', trader.userId))
        const name = userDoc.data()?.name || 'Usuário'

        return { user_id: trader.userId, name, quantity: trader.quantity, canOffer }
      })
    )

    return result
  } catch (error: any) {
    throw new Error(error.message || 'Falha ao buscar trocadores')
  }
}

export async function getMyDuplicatesWithNeeders(groupId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Não autenticado')

  try {
    // Get my duplicates
    const myDupesQ = query(
      collection(firestore, 'userStickers'),
      where('userId', '==', user.uid),
      where('groupId', '==', groupId)
    )
    const myDupesSnapshot = await getDocs(myDupesQ)
    const myDupes = myDupesSnapshot.docs
      .filter(doc => doc.data().quantity >= 2)
      .map(doc => ({ stickerId: doc.data().stickerId, quantity: doc.data().quantity }))

    if (myDupes.length === 0) return []

    // Get all members' stickers in the group
    const allStickersQ = query(
      collection(firestore, 'userStickers'),
      where('groupId', '==', groupId)
    )
    const allStickersSnapshot = await getDocs(allStickersQ)

    const byUser = new Map<string, { name: string; has: Set<string> }>()
    for (const doc of allStickersSnapshot.docs) {
      const data = doc.data()
      if (data.userId === user.uid) continue

      if (!byUser.has(data.userId)) {
        const userDoc = await getDoc(docPath('users', data.userId))
        byUser.set(data.userId, {
          name: userDoc.data()?.name || 'Usuário',
          has: new Set(),
        })
      }

      if (data.quantity >= 1) byUser.get(data.userId)!.has.add(data.stickerId)
    }

    return myDupes.map(dupe => {
      const needers = [...byUser.entries()]
        .filter(([, { has }]) => !has.has(dupe.stickerId))
        .map(([uid, { name }]) => ({ user_id: uid, name }))

      return { sticker_id: dupe.stickerId, quantity: dupe.quantity, needers }
    })
  } catch (error: any) {
    throw new Error(error.message || 'Falha ao buscar duplicatas')
  }
}

function docPath(col: string, id: string) {
  return doc(firestore, col, id)
}
