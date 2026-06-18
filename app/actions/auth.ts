'use client'

import { getFirebaseAuth } from '@/lib/firebase/client'

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

    const { signInWithEmailAndPassword } = await import('firebase/auth')
    const result = await signInWithEmailAndPassword(getFirebaseAuth(), email, pwd)
    const token = await result.user.getIdToken()

    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })

    if (!response.ok) {
      return { error: 'Erro ao salvar sessão' }
    }

    return { success: true }
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

    const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth')

    const result = await createUserWithEmailAndPassword(getFirebaseAuth(), email, pwd)
    await updateProfile(result.user, { displayName: userName })

    const token = await result.user.getIdToken()

    const userDocResponse = await fetch('/api/user-doc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, name: userName, email }),
    })
    if (!userDocResponse.ok) {
      return { error: 'Erro ao criar perfil de usuário' }
    }

    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })

    if (response.ok) {
      return { success: true }
    } else {
      return { error: 'Erro ao salvar sessão' }
    }
  } catch (error: any) {
    return { error: error.message || 'Erro ao criar conta' }
  }
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
