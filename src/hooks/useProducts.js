import { useQuery, useInfiniteQuery } from 'react-query'
import { useMemo } from 'react'
import { productsApi } from '@/services/api'
import { useSellerStore } from '@/store/sellerStore'
import { mockProducts } from '@/data/mockData'

function mergeListings(base, listings) {
  const active = listings.filter(l => l.status === 'active')
  const ids    = new Set(base.map(p => p.id))
  return [...base, ...active.filter(l => !ids.has(l.id))]
}

export function useProducts(filters = {}) {
  const listings = useSellerStore(s => s.listings)
  const allMock  = useMemo(() => {
    let base = mergeListings(mockProducts, listings)
    if (filters.q) {
      const q = filters.q.toLowerCase()
      base = base.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      )
    }
    return base
  }, [listings, filters.q])

  return useInfiniteQuery(
    ['products', filters, listings.length],
    ({ pageParam = 1 }) => productsApi.getAll({ ...filters, page: pageParam }),
    {
      getNextPageParam: (last) => last.nextPage ?? undefined,
      initialData: { pages: [{ data: allMock, nextPage: null }], pageParams: [undefined] },
      staleTime: 0,
    },
  )
}

export function useProduct(id) {
  const listings = useSellerStore(s => s.listings)

  return useQuery(
    ['product', id],
    () => productsApi.getById(id),
    {
      enabled: !!id,
      initialData: () =>
        mockProducts.find(p => p.id === id) ??
        listings.find(l => l.id === id),
    },
  )
}

export function useFeaturedProducts() {
  const listings = useSellerStore(s => s.listings)
  const allMock  = useMemo(() => mergeListings(mockProducts, listings).slice(0, 6), [listings])

  return useQuery(
    ['products', 'featured', listings.length],
    () => productsApi.getFeatured(),
    { initialData: allMock },
  )
}
