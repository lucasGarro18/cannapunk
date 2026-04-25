import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { reviewsApi } from '@/services/api'

export function useReviews(productId) {
  return useQuery(
    ['reviews', productId],
    () => reviewsApi.getByProduct(productId),
    { enabled: !!productId, staleTime: 60_000 },
  )
}

export function useCreateReview(productId) {
  const qc = useQueryClient()
  return useMutation(
    (data) => reviewsApi.create(productId, data),
    {
      onSuccess: () => {
        toast.success('Reseña publicada')
        qc.invalidateQueries(['reviews', productId])
        qc.invalidateQueries(['product', productId])
      },
      onError: (err) => {
        toast.error(err?.response?.data?.error ?? 'Error al publicar la reseña')
      },
    },
  )
}
