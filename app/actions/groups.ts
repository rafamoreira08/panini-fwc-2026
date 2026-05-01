import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebase/client'
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'

function generateInviteCode(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

async function getUid(): Promise<string> {
  const auth = getFirebaseAuth()
  await auth.authStateReady()
  if (!auth.currentUser) throw new Error('Não autenticado')
  return auth.currentUser.uid
}

export async function createGroup(name: string): Promise<string> {
  const uid = await getUid()
  const db = getFirebaseFirestore()

  const groupRef = await addDoc(collection(db, 'groups'), {
    name: name.trim(),
    inviteCode: generateInviteCode(),
    createdBy: uid,
    createdAt: serverTimestamp(),
  })

  await setDoc(doc(db, 'groupMembers', `${groupRef.id}-${uid}`), {
    groupId: groupRef.id,
    userId: uid,
    joinedAt: serverTimestamp(),
  })

  return groupRef.id
}

export async function joinGroup(inviteCode: string): Promise<string> {
  const uid = await getUid()
  const db = getFirebaseFirestore()

  const q = query(collection(db, 'groups'), where('inviteCode', '==', inviteCode))
  const snapshot = await getDocs(q)

  if (snapshot.empty) throw new Error('Código de convite inválido')

  const groupId = snapshot.docs[0].id

  const memberDoc = await getDoc(doc(db, 'groupMembers', `${groupId}-${uid}`))
  if (memberDoc.exists()) throw new Error('Você já é membro deste grupo')

  await setDoc(doc(db, 'groupMembers', `${groupId}-${uid}`), {
    groupId,
    userId: uid,
    joinedAt: serverTimestamp(),
  })

  return groupId
}

export async function joinGroupByCode(inviteCode: string): Promise<string> {
  return joinGroup(inviteCode)
}

export async function getGroup(groupId: string) {
  const uid = await getUid()
  const db = getFirebaseFirestore()

  const groupDoc = await getDoc(doc(db, 'groups', groupId))
  if (!groupDoc.exists()) return null

  const memberDoc = await getDoc(doc(db, 'groupMembers', `${groupId}-${uid}`))
  if (!memberDoc.exists()) return null

  return { id: groupDoc.id, ...groupDoc.data() }
}

export async function getUserGroups() {
  const uid = await getUid()
  const db = getFirebaseFirestore()

  const q = query(collection(db, 'groupMembers'), where('userId', '==', uid))
  const snapshot = await getDocs(q)

  const groups = await Promise.all(
    snapshot.docs.map(async memberDoc => {
      const groupRef = doc(db, 'groups', memberDoc.data().groupId)
      const groupDoc = await getDoc(groupRef)
      return {
        id: groupDoc.id,
        ...groupDoc.data(),
        joinedAt: memberDoc.data().joinedAt,
      }
    })
  )

  return groups.sort((a: any, b: any) => {
    const at = a.joinedAt?.seconds ?? 0
    const bt = b.joinedAt?.seconds ?? 0
    return bt - at
  })
}

export async function getGroupMembers(groupId: string) {
  const uid = await getUid()
  const db = getFirebaseFirestore()

  const memberDoc = await getDoc(doc(db, 'groupMembers', `${groupId}-${uid}`))
  if (!memberDoc.exists()) throw new Error('Sem permissão')

  const q = query(collection(db, 'groupMembers'), where('groupId', '==', groupId))
  const snapshot = await getDocs(q)

  return Promise.all(
    snapshot.docs.map(async m => {
      const userDoc = await getDoc(doc(db, 'users', m.data().userId))
      return {
        userId: m.data().userId,
        name: userDoc.data()?.name || 'Usuário',
        joinedAt: m.data().joinedAt,
      }
    })
  )
}
