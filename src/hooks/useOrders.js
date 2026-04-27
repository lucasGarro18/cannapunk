import { useQuery, useMutation, useQueryClient } from 'react-query'
import { ordersApi } from '@/services/api'
import { mockOrders } from '@/data/mockData'

async function withFallback(apiFn, mockFn) {
  try {
    return await apiFn()
  } catch (err) {
    if (!err.response) return await mockFn()
    throw err
  }
}

export function useOrders() {
  return useQuery(
    ['orders'],
    () => withFallback(() => ordersApi.getAll(), () => mockOrders),
    { initialData: mockOrders },
  )
}

export function useOrder(id) {
  return useQuery(
    ['order', id],
    () => withFallback(
      () => ordersApi.getById(id),
      () => mockOrders.find(o => o.id === id),
    ),
    {
      enabled: !!id,
      initialData: () => mockOrders.find(o => o.id === id),
    },
  )
}

export function useSellerOrders() {
  return useQuery(
    ['orders', 'seller'],
    () => withFallback(() => ordersApi.getSeller(), () => []),
    { initialData: [] },
  )
}

export function useDeliveryOrders() {
  return useQuery(
    ['orders', 'delivery'],
    () => withFallback(() => ordersApi.getDelivery(), () => mockOrders),
    { initialData: mockOrders },
  )
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation(
    (data) => withFallback(
      () => ordersApi.create(data),
      () => Promise.resolve({
        id: 'ORD-' + Date.now(),
        status: 'processing',
        createdAt: new Date().toISOString(),
        total: data.items?.reduce((a, i) => a + (i.price ?? 0), 0) ?? 0,
        items: data.items ?? [],
        earnedCommission: 0,
      }),
    ),
    { onSuccess: () => qc.invalidateQueries(['orders']) },
  )
}

export function useAdvanceOrderStatus() {
  const qc = useQueryClient()
  return useMutation(
    ({ id, status }) => withFallback(
      () => ordersApi.advanceStatus(id, status),
      () => Promise.resolve({ id, status }),
    ),
    {
      onSuccess: () => {
        qc.invalidateQueries(['orders', 'delivery'])
        qc.invalidateQueries(['orders'])
      },
    },
  )
}

export function useCancelOrder() {
  const qc = useQueryClient()
  return useMutation(
    (id) => ordersApi.cancel(id),
    {
      onSuccess: (_, id) => {
        qc.invalidateQueries(['orders'])
        qc.invalidateQueries(['order', id])
      },
    },
  )
}
