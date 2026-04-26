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

export async function signIn(formDataOrEmail: FormData | string, password?: string) {
  try {
    let email: string, pwd: string

    if (formDataOrEmail instanceof FormData) {
      email = formDataOrEmail.get('email') as string
      pwd = formDataOrEmail.get('password') as string
    } else {
      email = formDataOrEmail
      pwd = password!
    }

    const result = await signInWithEmailAndPassword(auth, email, pwd)
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

export async function signUp(formDataOrEmail: FormData | string, password?: string, name?: string) {
  try {
    let email: string, pwd: string, userName: string

    if (formDataOrEmail instanceof FormData) {
      email = formDataOrEmail.get('email') as string
      pwd = formDataOrEmail.get('password') as string
      userName = formDataOrEmail.get('name') as string
    } else {
      email = formDataOrEmail
      pwd = password!
      userName = name!
    }

    const result = await createUserWithEmailAndPassword(auth, email, pwd)
    await updateProfile(result.user, { displayName: userName })

    // Create user profile in Firestore
    await setDoc(doc(firestore, 'users', result.user.uid), {
      name: userName,
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
