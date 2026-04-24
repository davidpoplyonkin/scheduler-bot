import { useSuspenseQuery } from '@tanstack/react-query'

import crud_api from '../services/crud'

function UserPage() {
  const { data: whoami } = useSuspenseQuery({
    queryKey: ['who-am-i'],
    queryFn: async () => {
      return await crud_api.get('/')
    },
    staleTime: Infinity,
    retry: false,
  })

  return <p>{ whoami.data.tg_id }</p>
}

export default UserPage
