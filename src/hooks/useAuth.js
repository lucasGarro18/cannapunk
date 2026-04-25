import { useMutation } from 'react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/services/api'

// Si el backend no está disponible, simula la respuesta para poder trabajar offline
function mockResponse(data) {
  return new Promise(resolve => setTimeout(() => resolve({
    user: {
      id:             'u_' + Math.random().toString(36).slice(2, 8),
      name:           data.name ?? data.email.split('@')[0],
      email:          data.email,
      username:       data.username
                        ?? ((data.name ?? data.email.split('@')[0])
                             .toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_]/g, '') || 'user'),
      avatar:         null,
      bio:            '',
      roles:          ['buyer'],
      onboardingDone: false,
      payoutCbu: '', payoutMp: '', payoutUsdt: '',
    },
    token: 'mock_' + Date.now(),
  }), 700))
}

// Intenta la API real; si el backend no responde (network error) usa el mock
async function withFallback(apiFn, mockFn) {
  try {
    return await apiFn()
  } catch (err) {
    if (!err.response) return await mockFn()   // sin respuesta = backend offline
    throw err                                   // 4xx/5xx = error real, propagar
  }
}

export function useLogin() {
  const navigate       = useNavigate()
  const [searchParams] = useSearchParams()
  const login          = useAuthStore(s => s.login)

  return useMutation(
    ({ email, password }) => withFallback(
      () => authApi.login(email, password),
      () => mockResponse({ email }),
    ),
    {
      onSuccess: ({ user, token }) => {
        const savedOb = localStorage.getItem(`cannapunk-ob-${user.email}`) === '1'
        const onboardingDone = user.onboardingDone || savedOb
        login({ ...user, onboardingDone }, token)
        toast.success(`Bienvenido, ${user.name}!`)
        navigate(onboardingDone ? (searchParams.get('redirect') ?? '/') : '/onboarding')
      },
      onError: (err) => {
        toast.error(err?.response?.data?.error ?? 'Credenciales incorrectas')
      },
    },
  )
}

export function useRegister() {
  const navigate = useNavigate()
  const login    = useAuthStore(s => s.login)

  return useMutation(
    (data) => withFallback(
      () => authApi.register(data),
      () => mockResponse(data),
    ),
    {
      onSuccess: ({ user, token }) => {
        login(user, token)
        toast.success(`¡Bienvenido a CannaPunk, ${user.name}!`)
        navigate('/onboarding')
      },
      onError: (err) => {
        toast.error(err?.response?.data?.error ?? 'Error al crear la cuenta')
      },
    },
  )
}

export function useUpdateUser() {
  const updateUser = useAuthStore(s => s.updateUser)

  return useMutation(
    (data) => withFallback(
      () => authApi.updateMe(data),
      () => Promise.resolve(data),   // offline: sólo actualiza el store local
    ),
    {
      onSuccess: (updated, variables) => {
        updateUser({ ...variables, ...updated })
        toast.success('Cambios guardados')
      },
      onError: (err) => {
        toast.error(err?.response?.data?.error ?? 'Error al guardar')
      },
    },
  )
}

export function useChangePassword() {
  return useMutation(
    ({ currentPwd, newPwd }) => withFallback(
      () => authApi.changePassword(currentPwd, newPwd),
      () => Promise.resolve(),
    ),
    {
      onSuccess: () => toast.success('Contraseña actualizada'),
      onError:   (err) => toast.error(err?.response?.data?.error ?? 'Contraseña actual incorrecta'),
    },
  )
}

export function useLogout() {
  const navigate = useNavigate()
  const logout   = useAuthStore(s => s.logout)

  return () => {
    logout()
    toast.success('Sesión cerrada')
    navigate('/login')
  }
}
