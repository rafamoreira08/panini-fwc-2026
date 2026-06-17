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
  const q = query(collection(db, 'userStickers'))
  const snapshot = await getDocs(q)
  const result: Record<string, number> = {}
  for (const d of snapshot.docs) {
    if (d.data().userId === userId) {
      result[d.data().stickerId] = d.data().quantity
    }
  }
  return result
}

export async function getMyDuplicatesWithNeeders(groupId: string) {
  const uid = await getUid()
  const db = getFirebaseFirestore()

  const myStickers = await getUserStickers(uid)
  const duplicates = Object.entries(myStickers).filter(([_, qty]) => qty >= 2)

  const result = []
  for (const [stickerId, quantity] of duplicates) {
    const membersQ = query(collection(db, 'groupMembers'), where('groupId', '==', groupId))
    const membersDocs = await getDocs(membersQ)

    const needers: { user_id: string; name: string }[] = []
    for (const memberDoc of membersDocs.docs) {
      const memberId = memberDoc.data().userId
      if (memberId === uid) continue

      const memberStickerQ = query(
        collection(db, 'userStickers'),
        where('userId', '==', memberId),
        where('stickerId', '==', stickerId)
      )
      const stickerDocs = await getDocs(memberStickerQ)

      if (stickerDocs.empty) {
        const userDoc = await (await import('firebase/firestore')).getDoc(
          (await import('firebase/firestore')).doc(db, 'users', memberId)
        )
        if (userDoc.exists()) {
          needers.push({
            user_id: memberId,
            name: userDoc.data().name || 'Anônimo'
          })
        }
      }
    }

    if (needers.length > 0) {
      result.push({
        sticker_id: stickerId,
        quantity,
        needers
      })
    }
  }

  return result
}

export async function findTradersForSticker(groupId: string, stickerId: string) {
  const uid = await getUid()
  const db = getFirebaseFirestore()

  const membersQ = query(collection(db, 'groupMembers'), where('groupId', '==', groupId))
  const membersDocs = await getDocs(membersQ)

  const traders = []
  for (const memberDoc of membersDocs.docs) {
    const memberId = memberDoc.data().userId
    if (memberId === uid) continue

    const stickerQ = query(
      collection(db, 'userStickers'),
      where('userId', '==', memberId),
      where('stickerId', '==', stickerId)
    )
    const stickerDocs = await getDocs(stickerQ)

    if (!stickerDocs.empty) {
      const quantity = stickerDocs.docs[0].data().quantity
      const myStickers = await getUserStickers(uid)

      const canOffer = Object.entries(myStickers)
        .filter(([_, qty]) => qty >= 2)
        .map(([id]) => id)

      const userDoc = await (await import('firebase/firestore')).getDoc(
        (await import('firebase/firestore')).doc(db, 'users', memberId)
      )

      traders.push({
        user_id: memberId,
        name: userDoc.exists() ? userDoc.data().name || 'Anônimo' : 'Anônimo',
        quantity,
        canOffer
      })
    }
  }

  return traders
}
