'use server'

import { getCurrentUser } from '@/lib/firebase/server'
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
  writeBatch,
} from 'firebase/firestore'
import { firestore } from '@/lib/firebase/client'
import { redirect } from 'next/navigation'
import { randomBytes } from 'crypto'

function generateInviteCode(): string {
  return randomBytes(6).toString('hex').toUpperCase()
}

export async function createGroup(name: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Não autenticado')

  try {
    const groupRef = await addDoc(collection(firestore, 'groups'), {
      name: name.trim(),
      inviteCode: generateInviteCode(),
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    })

    // Add creator as member
    await setDoc(doc(firestore, 'groupMembers', `${groupRef.id}-${user.uid}`), {
      groupId: groupRef.id,
      userId: user.uid,
      joinedAt: serverTimestamp(),
    })

    redirect(`/groups/${groupRef.id}`)
  } catch (error: any) {
    throw new Error(error.message || 'Falha ao criar grupo')
  }
}

export async function joinGroup(inviteCode: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Não autenticado')

  try {
    // Find group by invite code
    const q = query(collection(firestore, 'groups'), where('inviteCode', '==', inviteCode))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      throw new Error('Código de convite inválido')
    }

    const groupDoc = snapshot.docs[0]
    const groupId = groupDoc.id

    // Check if already a member
    const memberDoc = await getDoc(doc(firestore, 'groupMembers', `${groupId}-${user.uid}`))
    if (memberDoc.exists()) {
      throw new Error('Você já é membro deste grupo')
    }

    // Add as member
    await setDoc(doc(firestore, 'groupMembers', `${groupId}-${user.uid}`), {
      groupId,
      userId: user.uid,
      joinedAt: serverTimestamp(),
    })

    redirect(`/groups/${groupId}`)
  } catch (error: any) {
    throw new Error(error.message || 'Falha ao entrar no grupo')
  }
}

export async function joinGroupByCode(inviteCode: string) {
  return joinGroup(inviteCode)
}

export async function getGroup(groupId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Não autenticado')

  try {
    const groupDoc = await getDoc(doc(firestore, 'groups', groupId))
    if (!groupDoc.exists()) return null

    // Verify user is a member
    const memberDoc = await getDoc(doc(firestore, 'groupMembers', `${groupId}-${user.uid}`))
    if (!memberDoc.exists()) return null

    return { id: groupDoc.id, ...groupDoc.data() }
  } catch (error: any) {
    throw new Error(error.message || 'Falha ao buscar grupo')
  }
}

export async function getUserGroups() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Não autenticado')

  try {
    const q = query(collection(firestore, 'groupMembers'), where('userId', '==', user.uid))
    const snapshot = await getDocs(q)

    const groups = await Promise.all(
      snapshot.docs.map(async (memberDoc) => {
        const groupRef = doc(firestore, 'groups', memberDoc.data().groupId)
        const groupDoc = await getDoc(groupRef)
        return {
          id: groupDoc.id,
          ...groupDoc.data(),
          joinedAt: memberDoc.data().joinedAt,
        }
      })
    )

    return groups.sort((a, b) => b.joinedAt - a.joinedAt)
  } catch (error: any) {
    throw new Error(error.message || 'Falha ao buscar grupos')
  }
}

export async function getGroupMembers(groupId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Não autenticado')

  try {
    // Verify user is a member
    const memberDoc = await getDoc(doc(firestore, 'groupMembers', `${groupId}-${user.uid}`))
    if (!memberDoc.exists()) throw new Error('Sem permissão')

    const q = query(collection(firestore, 'groupMembers'), where('groupId', '==', groupId))
    const snapshot = await getDocs(q)

    const members = await Promise.all(
      snapshot.docs.map(async (m) => {
        const userRef = doc(firestore, 'users', m.data().userId)
        const userDoc = await getDoc(userRef)
        return {
          userId: m.data().userId,
          name: userDoc.data()?.name || 'Usuário',
          joinedAt: m.data().joinedAt,
        }
      })
    )

    return members
  } catch (error: any) {
    throw new Error(error.message || 'Falha ao buscar membros')
  }
}
