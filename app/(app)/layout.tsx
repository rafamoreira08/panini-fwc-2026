import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/firebase/server'
import { Navbar } from '@/components/layout/Navbar'
import { doc, getDoc } from 'firebase/firestore'
import { firestore } from '@/lib/firebase/client'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  try {
    const userDoc = await getDoc(doc(firestore, 'users', user.uid))
    const userName = userDoc.data()?.name ?? user.email ?? ''

    return (
      <div className="min-h-screen flex flex-col">
        <Navbar userName={userName} />
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
          {children}
        </main>
      </div>
    )
  } catch (error) {
    redirect('/login')
  }
}
