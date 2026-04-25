import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { RiLockLine, RiEyeLine, RiEyeOffLine, RiCheckLine } from 'react-icons/ri'
import Logo from '@/components/ui/Logo'
import Spinner from '@/components/ui/Spinner'
import { authApi } from '@/services/api'

export default function ResetPasswordPage() {
  const [searchParams]  = useSearchParams()
  const token           = searchParams.get('token') ?? ''
  const navigate        = useNavigate()
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const [showPwd, setShowPwd]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(false)
  const [error, setError]       = useState(null)

  const onSubmit = async ({ password }) => {
    setLoading(true)
    setError(null)
    try {
      await authApi.resetConfirm(token, password)
      setDone(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (e) {
      setError(e.response?.data?.error ?? 'Token inválido o expirado')
    } finally {
      setLoading(false)
    }
  }

  if (!token) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0c0c0e' }}>
      <div className="text-center space-y-4">
        <p className="text-red-400">Link inválido.</p>
        <Link to="/forgot-password" className="btn-primary">Pedir nuevo link</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ background: '#0c0c0e' }}>
      <div className="w-full max-w-sm space-y-8">

        <div className="text-center">
          <Link to="/"><Logo size="lg" /></Link>
          <h1 className="mt-6 text-2xl font-bold">Nueva contraseña</h1>
          <p className="mt-1 text-sm" style={{ color: '#6b7280' }}>
            Elegí una contraseña segura
          </p>
        </div>

        <div className="card p-6 space-y-4">
          {done ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
                   style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)' }}>
                <RiCheckLine size={28} style={{ color: '#f59e0b' }} />
              </div>
              <div>
                <p className="font-semibold">¡Contraseña actualizada!</p>
                <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
                  Redirigiendo al login...
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nueva contraseña</label>
                <div className="relative">
                  <RiLockLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                              size={18} style={{ pointerEvents: 'none' }} />
                  <input
                    {...register('password', {
                      required: 'La contraseña es obligatoria',
                      minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                    })}
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    className="input"
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)} tabIndex={-1}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                    {showPwd ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Confirmar contraseña</label>
                <div className="relative">
                  <RiLockLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                              size={18} style={{ pointerEvents: 'none' }} />
                  <input
                    {...register('confirm', {
                      required: 'Confirmá la contraseña',
                      validate: v => v === watch('password') || 'Las contraseñas no coinciden',
                    })}
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Repetí la contraseña"
                    className="input"
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
                {errors.confirm && <p className="text-red-400 text-xs mt-1">{errors.confirm.message}</p>}
              </div>

              {error && <p className="text-red-400 text-xs">{error}</p>}

              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? <><Spinner size="sm" /> Guardando...</> : 'Cambiar contraseña'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
