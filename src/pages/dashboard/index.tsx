import { AuthContext } from '@/contexts/AuthContext'
import { setupAPIClient } from '@/services/api'
import { api } from '@/services/apiClient'
import { withSSRAuth } from '@/utils/withSSRAuth'
import { useContext, useEffect } from 'react'

export default function Dashboard() {
  const { user } = useContext(AuthContext)

  useEffect(() => {
    api
      .get('/me')
      .then((response) => console.log(response))
      .catch((err) => console.log(err))
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="flex flex-col my-auto gap-2">
        <h1>{user?.email}</h1>
      </div>
    </main>
  )
}

export const getServerSideProps = withSSRAuth(async (ctx) => {
  const apiClient = setupAPIClient(ctx)

  const response = await apiClient.get('/me')
  console.log('data', response.data)

  return {
    props: {},
  }
})
