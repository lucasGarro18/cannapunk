import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { earningsApi } from '@/services/api'
import { mockWallet } from '@/data/mockData'

async function withFallback(apiFn, fallback) {
  try {
    return await apiFn()
  } catch (err) {
    if (!err.response) return fallback
    throw err
  }
}

export function useWallet() {
  return useQuery(
    ['wallet'],
    () => withFallback(() => earningsApi.getSummary(), mockWallet),
    { initialData: mockWallet },
  )
}

export function useWithdraw() {
  const qc = useQueryClient()
  return useMutation(
    ({ amount, method }) => earningsApi.withdraw(amount, method),
    {
      onSuccess: () => {
        toast.success('Solicitud enviada. Te acreditamos en 24–48 hs.')
        qc.invalidateQueries(['wallet'])
      },
      onError: (err) => {
        toast.error(err?.response?.data?.error ?? 'Error al procesar el retiro')
      },
    },
  )
}
