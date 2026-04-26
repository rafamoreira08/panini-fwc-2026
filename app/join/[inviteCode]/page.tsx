import { getCurrentUser } from '@/lib/firebase/server'
import { redirect } from 'next/navigation'
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore'
import { firestore } from '@/lib/firebase/client'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { joinGroupByCode } from '@/app/actions/groups'

export default async function JoinPage({ params }: { params: Promise<{ inviteCode: string }> }) {
  const { inviteCode } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect(`/login?next=/join/${inviteCode}`)
  }

  // Find group by invite code
  const groupsQ = query(collection(firestore, 'groups'), where('inviteCode', '==', inviteCode))
  const groupsSnapshot = await getDocs(groupsQ)

  if (groupsSnapshot.empty) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-gray-900">Convite inválido</h1>
          <p className="text-gray-500 mt-2">Este link de convite não existe ou expirou.</p>
          <Link href="/dashboard" className="inline-block mt-4">
            <Button>Ir para meus grupos</Button>
          </Link>
        </div>
      </div>
    )
  }

  const group = groupsSnapshot.docs[0].data()
  const groupId = groupsSnapshot.docs[0].id

  // Check if already a member
  const memberDoc = await getDoc(doc(firestore, 'groupMembers', `${groupId}-${user.uid}`))
  if (memberDoc.exists()) {
    redirect(`/groups/${groupId}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border shadow-sm p-8 max-w-sm w-full text-center">
        <div className="text-5xl mb-4">⚽</div>
        <h1 className="text-xl font-bold text-gray-900">Você foi convidado!</h1>
        <p className="text-gray-600 mt-2">
          Para entrar no grupo <span className="font-semibold text-green-700">{group.name}</span>
        </p>
        <form
          action={async () => {
            'use server'
            await joinGroupByCode(inviteCode)
          }}
          className="mt-6"
        >
          <Button type="submit" size="lg" className="w-full">
            Entrar no grupo
          </Button>
        </form>
        <Link href="/dashboard" className="block mt-3 text-sm text-gray-400 hover:text-gray-600">
          Cancelar
        </Link>
      </div>
    </div>
  )
}
