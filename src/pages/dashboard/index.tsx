import { AuthContext } from '@/contexts/AuthContext'
import { useContext } from 'react'

export default function Dashboard() {
  const { user } = useContext(AuthContext)

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="flex flex-col my-auto gap-2">
        <h1>{user?.email}</h1>
      </div>
    </main>
  )
}
