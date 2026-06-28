'use client'

import { useEffect } from 'react'
import { getFirebaseAuth } from '@/lib/firebase/client'

/**
 * O cookie `__session` guarda o ID token do Firebase, que expira em ~1h.
 * O SDK do Firebase renova esse token sozinho em segundo plano enquanto o
 * app está aberto; este componente apenas escuta essa renovação e reenvia
 * o token novo para `/api/auth/session`, mantendo o cookie sempre válido.
 */
export function SessionSync() {
  useEffect(() => {
    const auth = getFirebaseAuth()
    const unsubscribe = auth.onIdTokenChanged(async user => {
      if (!user) return
      try {
        const token = await user.getIdToken()
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
      } catch {
        // melhor esforço — se falhar, o usuário só vai precisar logar de novo depois
      }
    })
    return unsubscribe
  }, [])

  return null
}
