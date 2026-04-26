import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { productsApi } from '@/services/api'
import { useSellerStore } from '@/store/sellerStore'

async function withFallback(apiFn, fallback) {
  try {
    return await apiFn()
  } catch (err) {
    if (!err.response) return fallback
    throw err
  }
}

export function useSellerProducts() {
  const listings = useSellerStore(s => s.listings)

  return useQuery(
    ['products', 'mine'],
    () => withFallback(() => productsApi.getMine(), listings),
    { initialData: listings, staleTime: 30_000 },
  )
}

export function useCreateProduct() {
  const qc        = useQueryClient()
  const addListing = useSellerStore(s => s.addListing)

  return useMutation(
    (data) => {
      const fallback = { ...data, id: `p_${Date.now()}`, status: 'pending', salesCount: 0 }
      return withFallback(() => productsApi.create(data), fallback)
    },
    {
      onSuccess: (product) => {
        addListing(product)
        qc.invalidateQueries(['products', 'mine'])
        qc.invalidateQueries(['products'])
        toast.success(`"${product.name}" publicado en el marketplace`)
      },
      onError: (err) => {
        toast.error(err?.response?.data?.error ?? 'Error al publicar el producto')
      },
    },
  )
}

export function useUpdateProduct() {
  const qc            = useQueryClient()
  const updateListing  = useSellerStore(s => s.updateListing)

  return useMutation(
    ({ id, ...data }) => withFallback(
      () => productsApi.update(id, data),
      { id, ...data },
    ),
    {
      onSuccess: (product) => {
        updateListing(product.id, product)
        qc.invalidateQueries(['products', 'mine'])
        qc.invalidateQueries(['products'])
      },
      onError: (err) => {
        toast.error(err?.response?.data?.error ?? 'Error al actualizar el producto')
      },
    },
  )
}

export function useDeleteProduct() {
  const qc             = useQueryClient()
  const removeListing  = useSellerStore(s => s.removeListing)

  return useMutation(
    (id) => withFallback(
      () => productsApi.delete(id),
      null,
    ),
    {
      onSuccess: (_, id) => {
        removeListing(id)
        qc.invalidateQueries(['products', 'mine'])
        qc.invalidateQueries(['products'])
        toast.success('Producto eliminado')
      },
      onError: (err) => {
        toast.error(err?.response?.data?.error ?? 'Error al eliminar el producto')
      },
    },
  )
}
