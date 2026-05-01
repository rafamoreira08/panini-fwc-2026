import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/firebase/server'
import { Navbar } from '@/components/layout/Navbar'
import { BottomNav } from '@/components/layout/BottomNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const userName = user.email ?? ''

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar userName={userName} />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 pb-20 md:pb-6">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
