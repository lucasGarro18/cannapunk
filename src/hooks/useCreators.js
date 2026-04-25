import { useQuery } from 'react-query'
import { creatorsApi } from '@/services/api'
import { mockCreators } from '@/data/mockData'

export function useCreator(username) {
  return useQuery(
    ['creator', username],
    () => creatorsApi.getByUsername(username),
    {
      enabled: !!username,
      initialData: () => mockCreators.find(c => c.username === username),
    },
  )
}

export function useTopCreators(limit = 6) {
  return useQuery(
    ['creators', 'top', limit],
    () => creatorsApi.getTop({ limit }),
    { initialData: mockCreators.slice(0, limit) },
  )
}
