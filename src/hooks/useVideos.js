import { useQuery, useInfiniteQuery } from 'react-query'
import { videosApi } from '@/services/api'
import { mockVideos } from '@/data/mockData'

const MOCK_PAGE = { data: mockVideos, nextPage: null }

export function useFeedVideos() {
  return useInfiniteQuery(
    ['videos', 'feed'],
    async ({ pageParam = 1 }) => {
      try {
        return await videosApi.getFeed({ page: pageParam })
      } catch (err) {
        if (!err.response) return MOCK_PAGE   // backend offline → mock silencioso
        throw err
      }
    },
    {
      getNextPageParam: (last) => last.nextPage ?? undefined,
      initialData: { pages: [MOCK_PAGE], pageParams: [undefined] },
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  )
}

export function useProductVideos(productId) {
  return useQuery(
    ['videos', 'product', productId],
    () => videosApi.getByProduct(productId),
    {
      enabled: !!productId,
      initialData: mockVideos.filter(v => v.product?.id === productId),
    },
  )
}

export function useCreatorVideos(username) {
  return useQuery(
    ['videos', 'creator', username],
    () => videosApi.getByCreator(username),
    {
      enabled: !!username,
      initialData: mockVideos.filter(v => v.creator.username === username),
    },
  )
}

export function useSearchVideos(q) {
  return useQuery(
    ['videos', 'search', q],
    () => videosApi.getFeed({ q, limit: 20 }).then(r => r.data ?? []),
    {
      enabled: !!q,
      staleTime: 30_000,
      initialData: [],
    },
  )
}
