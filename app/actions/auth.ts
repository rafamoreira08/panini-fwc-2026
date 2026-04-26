'use client'

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth'
import { auth } from '@/lib/firebase/client'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { firestore } from '@/lib/firebase/client'
import { redirect } from 'next/navigation'

export async function signIn(email: string, password: string) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password)
    const token = await result.user.getIdToken()

    // Store token in cookie for server actions
    await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })

    redirect('/dashboard')
  } catch (error: any) {
    return { error: error.message || 'Erro ao entrar' }
  }
}

export async function signUp(email: string, password: string, name: string) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(result.user, { displayName: name })

    // Create user profile in Firestore
    await setDoc(doc(firestore, 'users', result.user.uid), {
      name,
      email,
      createdAt: serverTimestamp(),
    })

    const token = await result.user.getIdToken()
    await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })

    redirect('/dashboard')
  } catch (error: any) {
    return { error: error.message || 'Erro ao criar conta' }
  }
}

export async function signOut() {
  try {
    await firebaseSignOut(auth)
    await fetch('/api/auth/logout', { method: 'POST' })
    redirect('/login')
  } catch (error: any) {
    return { error: error.message || 'Erro ao sair' }
  }
}
